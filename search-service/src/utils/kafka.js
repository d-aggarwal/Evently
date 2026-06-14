import { Kafka, logLevel } from 'kafkajs';
import logger from './logger.js';

const kafka = new Kafka({
     clientId: process.env.KAFKA_CLIENT_ID,
     brokers: [process.env.KAFKA_BROKER || 'localhost:9093'],
     logLevel: logLevel.ERROR,
     retry: {
          initialRetryTime: 300,
          retries: 8,
          maxRetryTime: 30000
     },
});

export const consumer = kafka.consumer({
     groupId: 'search-service-group',
     sessionTimeout: 30000,
     heartbeatInterval: 3000,
});

const shut = async () => {
     logger.info('Shutting down Kafka connections...');
     await consumer.disconnect();
     process.exit(0);
};


process.on('SIGTERM', shut);
process.on('SIGINT', shut);

export { kafka, shut};
