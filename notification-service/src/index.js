import dotenv from "dotenv"
import app from "./app.js";
import emailConsumer from './kafka/consumer/email.consumer.js';
import logger from './utils/logger.js';


dotenv.config({
    path: './.env'
})

async function startNotificationService() {
     try {
          logger.info('Starting Notification Service...');

          const requiredEnvVars = ['SENDGRID_API_KEY', 'MAIL_SEND', 'KAFKA_BROKER'];
          const missing = requiredEnvVars.filter(varName => !process.env[varName]);

          if (missing.length > 0) {
               throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
          }

          await emailConsumer.start();

          logger.info('✅ Notification Service started successfully');
          logger.info('Service is ready to process notifications');

     } catch (error) {
          logger.error('Failed to start Notification Service', {
               error: error.message,
               stack: error.stack
          });
          process.exit(1);
     }
}

process.on('unhandledRejection', (reason, promise) => {
     logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
     logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
     process.exit(1);
});

startNotificationService();
