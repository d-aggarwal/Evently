const { bookingQueue, waitlistQueue, notificationQueue } = require('../config/queue');

class QueueService {
  constructor() {
    this.setupJobProcessors();
  }

  setupJobProcessors() {
    // Booking job processor
    bookingQueue.process('process-booking', async (job) => {
      const { userId, eventId, quantity, priority = false } = job.data;
      
      try {
        // Lazy load to avoid circular dependency
        const bookingService = require('./bookingService');
        const booking = await bookingService.processBookingJob(userId, eventId, quantity, priority);
        
        // Remove the waitlist processing here - it's handled in cancellation
        return booking;
      } catch (error) {
        // If booking fails due to capacity, add to waitlist
        if (error.message.includes('tickets available') || error.message.includes('sold out')) {
          await waitlistQueue.add('add-to-waitlist', {
            userId,
            eventId,
            quantity
          });
          throw new Error('Event is full. Added to waitlist.');
        }
        throw error;
      }
    });

    // Waitlist job processor
    waitlistQueue.process('add-to-waitlist', async (job) => {
      const { userId, eventId, quantity } = job.data;
      const waitlistService = require('./waitlistService');
      return await waitlistService.addToWaitlist(userId, eventId, quantity);
    });

    waitlistQueue.process('process-waitlist-on-cancellation', async (job) => {
      const { eventId, availableQuantity } = job.data;
      const waitlistService = require('./waitlistService');
      return await waitlistService.processWaitlistOnCancellation(eventId, availableQuantity);
    });

    // Notification job processor
    notificationQueue.process('send-waitlist-notification', async (job) => {
      const { userId, eventId, availableTickets } = job.data;
      console.log(`✅ Notifying user ${userId} about ${availableTickets} available tickets for event ${eventId}`);
      // TODO: Implement actual email/SMS notification
      return { notified: true, userId, eventId, availableTickets };
    });
  }

  // Add booking to queue
  async queueBooking(userId, eventId, quantity, priority = false) {
    const jobOptions = priority ? { priority: 1 } : {};
    
    return await bookingQueue.add('process-booking', {
      userId,
      eventId,
      quantity,
      priority
    }, jobOptions);
  }

  // Add waitlist processing to queue
  async queueWaitlistProcessing(eventId, availableQuantity) {
    return await waitlistQueue.add('process-waitlist-on-cancellation', {
      eventId,
      availableQuantity
    });
  }

  // Get queue stats for monitoring
  async getQueueStats() {
    const [bookingStats, waitlistStats, notificationStats] = await Promise.all([
      this.getQueueInfo(bookingQueue),
      this.getQueueInfo(waitlistQueue),
      this.getQueueInfo(notificationQueue)
    ]);

    return {
      booking: bookingStats,
      waitlist: waitlistStats,
      notification: notificationStats
    };
  }

  async getQueueInfo(queue) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }
}

module.exports = new QueueService();
