const { Booking, Event, User, sequelize } = require('../models');
const redisClient = require('../config/redis');

class BookingService {
  constructor() {
    this.redis = redisClient.getClient();
  }

  // Generate unique booking reference
  generateBookingReference() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `EVT-${timestamp}-${random}`.toUpperCase();
  }

  // Enhanced create booking with queue support
  async createBooking(userId, eventId, quantity) {
    // ALWAYS use distributed locking for capacity-limited events
    // Check if we should use queue based on environment settings
    const useQueue = process.env.USE_QUEUE === 'true';
    const queueThreshold = parseInt(process.env.QUEUE_THRESHOLD) || 1;
    const shouldQueue = useQueue && quantity >= queueThreshold;
    
    // For concurrent scenarios, ALWAYS process through queue to prevent race conditions
    const concurrentLoad = await this.checkConcurrentLoad(eventId);
    
    if (shouldQueue || concurrentLoad) {
      // Queue the booking for processing
      const queueService = require('./queueService');
      const job = await queueService.queueBooking(userId, eventId, quantity);
      
      return {
        message: 'Booking request queued for processing',
        jobId: job.id,
        status: 'queued',
        estimatedProcessingTime: '30 seconds'
      };
    } else {
      // Process immediately with STRONG locking
      return await this.processBookingJobWithStrongLock(userId, eventId, quantity);
    }
  }

  // Check if there's concurrent load on this event
  async checkConcurrentLoad(eventId) {
    const lockKey = `concurrent_check:${eventId}`;
    const currentLocks = await this.redis.keys(`booking_lock:${eventId}*`);
    return currentLocks.length > 0; // If any locks exist, use queue
  }

  // Enhanced booking processing with stronger locking
  async processBookingJobWithStrongLock(userId, eventId, quantity, priority = false) {
    const globalLockKey = `global_booking_lock:${eventId}`;
    const lockValue = `${userId}_${Date.now()}_${Math.random()}`;
    const lockTTL = 30000; // 30 seconds

    let lockAcquired = false;
    let attempts = 0;
    const maxAttempts = 5;

    // Aggressive lock acquisition with retry
    while (!lockAcquired && attempts < maxAttempts) {
      lockAcquired = await this.redis.set(globalLockKey, lockValue, 'PX', lockTTL, 'NX');
      if (!lockAcquired) {
        attempts++;
        console.log(`🔄 Lock attempt ${attempts} failed for event ${eventId}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 50 * attempts)); // Quick retry
      }
    }

    if (!lockAcquired) {
      throw new Error('Event is currently busy with other bookings. Please try again.');
    }

    console.log(`🔒 ACQUIRED LOCK for event ${eventId} by user ${userId}`);

    try {
      // Use SERIALIZABLE isolation level for maximum consistency
      const result = await sequelize.transaction({
        isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      }, async (transaction) => {
        
        // Get event with exclusive lock - this prevents any other reads/writes
        const event = await sequelize.query(`
          SELECT * FROM events 
          WHERE id = :eventId 
          FOR UPDATE
        `, {
          replacements: { eventId },
          type: sequelize.QueryTypes.SELECT,
          transaction,
          raw: true
        });

        if (!event || event.length === 0) {
          throw new Error('Event not found');
        }

        const eventData = event[0];

        if (eventData.status !== 'published') {
          throw new Error('Event is not available for booking');
        }

        if (new Date(eventData.dateTime) <= new Date()) {
          throw new Error('Cannot book tickets for past events');
        }

        console.log(`📊 Current availability for event ${eventId}: ${eventData.availableCapacity}, requested: ${quantity}`);

        // CRITICAL: Strict capacity check
        if (eventData.availableCapacity < quantity) {
          console.log(`❌ INSUFFICIENT CAPACITY: Available ${eventData.availableCapacity}, Requested ${quantity}`);
          throw new Error(`Only ${eventData.availableCapacity} tickets available`);
        }

        if (eventData.availableCapacity === 0) {
          console.log(`❌ EVENT SOLD OUT: No tickets available`);
          throw new Error('Event is sold out');
        }

        // Calculate total amount
        const totalAmount = parseFloat(eventData.price) * quantity;

        // Create booking first
        const bookingData = {
          userId,
          eventId,
          quantity,
          totalAmount,
          status: 'confirmed',
          bookingReference: this.generateBookingReference()
        };

        const [booking] = await sequelize.query(`
          INSERT INTO bookings (id, "userId", "eventId", quantity, "totalAmount", status, "bookingReference", "createdAt", "updatedAt")
          VALUES (:id, :userId, :eventId, :quantity, :totalAmount, :status, :bookingReference, NOW(), NOW())
          RETURNING *
        `, {
          replacements: {
            id: require('uuid').v4(),
            userId: bookingData.userId,
            eventId: bookingData.eventId,
            quantity: bookingData.quantity,
            totalAmount: bookingData.totalAmount,
            status: bookingData.status,
            bookingReference: bookingData.bookingReference
          },
          type: sequelize.QueryTypes.INSERT,
          transaction
        });

        // Update capacity with atomic operation and double-check
        const [updateResult] = await sequelize.query(`
          UPDATE events 
          SET "availableCapacity" = "availableCapacity" - :quantity,
              "updatedAt" = NOW()
          WHERE id = :eventId 
            AND "availableCapacity" >= :quantity
            AND status = 'published'
          RETURNING "availableCapacity"
        `, {
          replacements: { eventId, quantity },
          type: sequelize.QueryTypes.UPDATE,
          transaction
        });

        if (!updateResult || updateResult.length === 0) {
          console.log(`❌ ATOMIC UPDATE FAILED: Capacity check failed during update`);
          throw new Error('Tickets are no longer available - another booking occurred simultaneously');
        }

        const newCapacity = updateResult[0].availableCapacity;
        console.log(`✅ BOOKING CONFIRMED: ${bookingData.bookingReference}, New capacity: ${newCapacity}`);

        return {
          id: booking[0].id,
          bookingReference: bookingData.bookingReference,
          quantity: bookingData.quantity,
          totalAmount: bookingData.totalAmount,
          status: bookingData.status
        };
      });

      // Release lock
      await this.releaseLock(globalLockKey, lockValue);
      console.log(`🔓 RELEASED LOCK for event ${eventId}`);

      // Return booking details
      return result;

    } catch (error) {
      // Ensure lock is released even on error
      await this.releaseLock(globalLockKey, lockValue);
      console.log(`🔓 RELEASED LOCK (ERROR) for event ${eventId}`);
      console.error(`❌ BOOKING FAILED for user ${userId}, event ${eventId}:`, error.message);
      throw error;
    }
  }

  // Enhanced lock release with Lua script
  async releaseLock(lockKey, lockValue) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    try {
      const result = await this.redis.eval(script, 1, lockKey, lockValue);
      return result === 1;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }

  // Actual booking processing logic (used by both direct and queue)
  async processBookingJob(userId, eventId, quantity, priority = false) {
    const lockKey = `booking_lock:${eventId}`;
    const lockValue = `${userId}_${Date.now()}`;
    const lockTTL = 30; // 30 seconds

    try {
      // Acquire distributed lock
      const lockAcquired = await this.redis.set(lockKey, lockValue, 'PX', lockTTL * 1000, 'NX');
      
      if (!lockAcquired) {
        throw new Error('Another booking is in progress for this event. Please try again.');
      }

      // Start database transaction
      const result = await sequelize.transaction(async (transaction) => {
        // Get event with lock
        const event = await Event.findByPk(eventId, {
          lock: true,
          transaction
        });

        if (!event) {
          throw new Error('Event not found');
        }

        if (event.status !== 'published') {
          throw new Error('Event is not available for booking');
        }

        if (new Date(event.dateTime) <= new Date()) {
          throw new Error('Cannot book tickets for past events');
        }

        if (event.availableCapacity < quantity) {
          throw new Error(`Only ${event.availableCapacity} tickets available`);
        }

        // Calculate total amount
        const totalAmount = parseFloat(event.price) * quantity;

        // Create booking
        const booking = await Booking.create({
          userId,
          eventId,
          quantity,
          totalAmount,
          status: 'confirmed',
          bookingReference: this.generateBookingReference()
        }, { transaction });

        // Update event capacity
        await event.update({
          availableCapacity: event.availableCapacity - quantity
        }, { transaction });

        return booking;
      });

      // Release lock
      await this.releaseLock(lockKey, lockValue);

      // Return booking with event details
      return await this.getBookingById(result.id, userId);

    } catch (error) {
      // Ensure lock is released even on error
      await this.releaseLock(lockKey, lockValue);
      throw error;
    }
  }

  // Enhanced cancel booking with waitlist processing
  async cancelBooking(bookingId, userId, reason = null) {
    const lockKey = `cancel_lock:${bookingId}`;
    const lockValue = `${userId}_${Date.now()}`;

    try {
      const lockAcquired = await this.redis.set(lockKey, lockValue, 'PX', 30000, 'NX');
      
      if (!lockAcquired) {
        throw new Error('Another cancellation is in progress. Please try again.');
      }

      const result = await sequelize.transaction(async (transaction) => {
        // First get booking without lock and include
        const booking = await Booking.findOne({
          where: { id: bookingId, userId },
          include: [{ model: Event, as: 'event' }],
          transaction
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.status === 'cancelled') {
          throw new Error('Booking is already cancelled');
        }

        // Check if event allows cancellation (e.g., 24 hours before)
        const eventDate = new Date(booking.event.dateTime);
        const now = new Date();
        const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);

        if (hoursUntilEvent < 24) {
          throw new Error('Cannot cancel booking less than 24 hours before event');
        }

        // Now lock the booking for update
        const lockedBooking = await Booking.findByPk(bookingId, {
          lock: true,
          transaction
        });

        // Lock the event for capacity update
        const lockedEvent = await Event.findByPk(booking.eventId, {
          lock: true,
          transaction
        });

        // Update booking
        await lockedBooking.update({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason
        }, { transaction });

        // Restore event capacity
        await lockedEvent.update({
          availableCapacity: lockedEvent.availableCapacity + booking.quantity
        }, { transaction });

        // Return updated booking with event details
        return await Booking.findByPk(bookingId, {
          include: [{ model: Event, as: 'event' }],
          transaction
        });
      });

      await this.releaseLock(lockKey, lockValue);

      // After successful cancellation, trigger waitlist processing
      if (result) {
        const queueService = require('./queueService');
        await queueService.queueWaitlistProcessing(result.event.id, result.quantity);
      }

      return result;

    } catch (error) {
      await this.releaseLock(lockKey, lockValue);
      throw error;
    }
  }

  // Get user's bookings
  async getUserBookings(userId, filters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Booking.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      bookings: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBookings: count
      }
    };
  }

  // Helper: Release distributed lock
  async releaseLock(lockKey, lockValue) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    try {
      await this.redis.eval(script, 1, lockKey, lockValue);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }
}

module.exports = new BookingService();
