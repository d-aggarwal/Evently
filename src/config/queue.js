const Queue = require('bull');

// Queue configurations
const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
};

// Create queues
const bookingQueue = new Queue('booking processing', queueOptions);
const waitlistQueue = new Queue('waitlist processing', queueOptions);
const notificationQueue = new Queue('notification processing', queueOptions);

// Queue event handlers for monitoring
const setupQueueMonitoring = (queue, name) => {
  queue.on('completed', (job) => {
    console.log(`${name} job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    console.error(`${name} job ${job.id} failed:`, err.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`${name} job ${job.id} stalled`);
  });
};

setupQueueMonitoring(bookingQueue, 'Booking');
setupQueueMonitoring(waitlistQueue, 'Waitlist');
setupQueueMonitoring(notificationQueue, 'Notification');

module.exports = {
  bookingQueue,
  waitlistQueue,
  notificationQueue
};
