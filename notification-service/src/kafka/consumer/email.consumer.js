import { consumer } from '../../utils/kafka.js';
import emailService from '../../services/email.services.js';
import logger from '../../utils/logger.js';
import { KAFKA_TOPICS } from '../../../../shared/constants/kafka-topics.js';

class EmailConsumer {
     async start() {
          try {
               await consumer.connect();
               logger.info('Email consumer connected to Kafka');

               await consumer.subscribe({
                    topics: Object.values(KAFKA_TOPICS),
                    fromBeginning: false
               });

               await consumer.run({
                    eachMessage: async ({ topic, partition, message }) => {
                        try{
                            const value = JSON.parse(message.value.toString());
                            logger.info(`Received message on topic ${topic}`, { partition, offset: message.offset, 
                                key: message.key?.toString(),
                             });
                             await this.handleMessage(topic, value);
                        }
                        catch(error){
                            logger.error('Error processing message', { error: error.message, topic, partition, offset: message.offset });
                        }
                    }
                });

               logger.info('Email consumer is running and listening for messages...');
          } catch (error) {
               logger.error('Failed to start email consumer', { error: error.message });
               throw error;
          }
     }

     async handleMessage(topic, data) {
          switch (topic) {
               case KAFKA_TOPICS.WELCOME_EMAIL:
                    await this.handleWelcomeEmail(data);
                    break;

               case KAFKA_TOPICS.BOOKING_CONFIRMED:
                    await this.handleBookingConfirmed(data);
                    break;

               case KAFKA_TOPICS.BOOKING_FAILED:
                    await this.handleBookingFailed(data);
                    break;

               case KAFKA_TOPICS.BOOKING_CANCELLED:
                    await this.handleBookingCancelled(data);
                    break;

               default:
                    logger.warn(`Unknown topic: ${topic}`);
          }
     }

     async handleWelcomeEmail(data) {
          const { email, firstName } = data;

          if (!email || !firstName) {
               throw new Error('Missing required fields: email or firstName');
          }

          await emailService.sendWelcomeEmail(email, firstName);
          logger.info(`Welcome email sent to ${email}`);
     }

     async handleBookingConfirmed(data) {
          const { email, bookingId } = data;

          if (!email) {
               logger.warn(`Skipping booking-confirmed email — no email on event`, { bookingId });
               return;
          }

          await emailService.sendBookingConfirmedEmail(email, data);
          logger.info(`Booking confirmed email sent to ${email}`, { bookingId });
     }

     async handleBookingFailed(data) {
          const { email, bookingId } = data;

          if (!email) {
               logger.warn(`Skipping booking-failed email — no email on event`, { bookingId });
               return;
          }

          await emailService.sendBookingFailedEmail(email, data);
          logger.info(`Booking failed email sent to ${email}`, { bookingId });
     }

     async handleBookingCancelled(data) {
          const { email, bookingId } = data;

          if (!email) {
               logger.warn(`Skipping booking-cancelled email — no email on event`, { bookingId });
               return;
          }

          await emailService.sendBookingCancelledEmail(email, data);
          logger.info(`Booking cancelled email sent to ${email}`, { bookingId });
     }

     async stop() {
          await consumer.disconnect();
          logger.info('Email consumer disconnected');
     }
}

export default new EmailConsumer();
