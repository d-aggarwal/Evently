import { consumer } from '../../utils/kafka.js';
import searchService from '../../services/search.service.js';
import logger from '../../utils/logger.js';
import { KAFKA_TOPICS } from '../../../../shared/constants/kafka-topics.js';

class SearchConsumer {
     async start() {
          await consumer.connect();

          logger.info('Search consumer connected');

          await consumer.subscribe({
               topics: [
                    KAFKA_TOPICS.STATION_CREATED,
                    KAFKA_TOPICS.ROUTE_CREATED,
                    KAFKA_TOPICS.SCHEDULE_CREATED,
                    KAFKA_TOPICS.SCHEDULE_CANCELLED,
                    KAFKA_TOPICS.SEAT_AVAILABILITY_UPDATED,
               ],
               fromBeginning: true,
          });

          await consumer.run({
               eachMessage: async ({ topic, partition, message}) => {
                try {
                    const parsedValue = JSON.parse(message.value.toString());
                    logger.info(`Processing ${topic}`, { partition, offset: message.offset });

                    switch (topic) {
                         case KAFKA_TOPICS.STATION_CREATED:
                              await searchService.indexStation(parsedValue);
                              break;
                         case KAFKA_TOPICS.ROUTE_CREATED:
                              await searchService.indexTrainRoute(parsedValue);
                              break;
                         case KAFKA_TOPICS.SCHEDULE_CREATED:
                              await searchService.indexSchedule(parsedValue);
                              break;
                         case KAFKA_TOPICS.SCHEDULE_CANCELLED:
                              await searchService.cancelSchedule(parsedValue);
                              break;
                         case KAFKA_TOPICS.SEAT_AVAILABILITY_UPDATED:
                              await searchService.updateSeatAvailability(parsedValue);
                              break;
                         default:
                              logger.warn(`Unknown topic: ${topic}`);
                    }
                } catch (error) {
                    logger.error(`Error processing message on topic ${topic}`, { error: error.message, partition, offset: message.offset });
                }
               },
          });

          logger.info('Search consumer running...');
     }
}

export default new SearchConsumer();
