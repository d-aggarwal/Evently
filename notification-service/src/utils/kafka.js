import { Kafka, logLevel } from 'kafkajs';
import logger from './logger.js';

const kafka = new Kafka({
     clientId: process.env.KAFKA_CLIENT_ID,
     brokers: [process.env.KAFKA_BROKER || 'localhost:9093'],
     logLevel: logLevel.ERROR,
     retry: {
          initialRetryTime: 300,
          retries: 10,
          maxRetryTime: 30000,
          multiplier: 2,
     },
});

export const consumer = kafka.consumer({
     groupId: 'notification-service-group',
     sessionTimeout: 30000,
     heartbeatInterval: 3000,
});

const shutdown = async () => {
     logger.info('Shutting down Kafka connections...');
     await consumer.disconnect();
     process.exit(0);
};


process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { kafka };
