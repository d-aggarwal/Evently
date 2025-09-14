const { Booking, Event, User, sequelize } = require('../models');
// const redisClient = require('../config/redis');

class BookingService {
  constructor() {
    // this.redis = redisClient.getClient();
  }

  // Generate unique booking reference
  generateBookingReference() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `EVT-${timestamp}-${random}`.toUpperCase();
  }

  // Enhanced create booking with queue support
  async createBooking(userId, eventId, quantity) {
    // Disable queue processing temporarily 
    const useQueue = false; // Force disable queue
    
    // Process booking directly without queue
    return await this.processBookingJobWithStrongLock(userId, eventId, quantity);
  }

  // Check if there's concurrent load on this event
  async checkConcurrentLoad(eventId) {
    const lockKey = `concurrent_check:${eventId}`;
    const currentLocks = await this.redis.keys(`booking_lock:${eventId}*`);
    return currentLocks.length > 0; // If any locks exist, use queue
  }

  // Enhanced booking processing with stronger locking
  async processBookingJobWithStrongLock(userId, eventId, quantity, priority = false) {
    // Skip Redis locking for now, use database transaction only
    try {
      const result = await sequelize.transaction({
        isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      }, async (transaction) => {
        
        const event = await Event.findByPk(eventId, {
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        if (!event) {
          throw new Error('Event not found');
        }

        if (event.status !== 'published') {
          throw new Error('Event is not available for booking');
        }

        if (event.availableCapacity < quantity) {
          throw new Error(`Only ${event.availableCapacity} tickets available`);
        }

        const totalAmount = parseFloat(event.price) * quantity;

        const booking = await Booking.create({
          userId,
          eventId,
          quantity,
          totalAmount,
          status: 'confirmed',
          bookingReference: this.generateBookingReference()
        }, { transaction });

        await event.update({
          availableCapacity: event.availableCapacity - quantity
        }, { transaction });

        return booking;
      });

      return result;
    } catch (error) {
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
