import sgMail from '@sendgrid/mail';
import logger from '../utils/logger.js';
import { getWelcomeTemplate, getBookingConfirmedTemplate, getBookingFailedTemplate, getBookingCancelledTemplate } from '../templates/index.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
     constructor() {
          this.from = process.env.MAIL_SEND;
          this.maxRetries = 3;
     }

     async sendWithRetry(msg, retries = 0) {
          try {
               await sgMail.send(msg);
               logger.info(`Email sent successfully to ${msg.to}`, {
                    subject: msg.subject,
                    attempt: retries + 1
               });
               return { success: true };
          } catch (error) {
               logger.error(`Email sending failed (attempt ${retries + 1}/${this.maxRetries})`, {
                    to: msg.to,
                    error: error.message,
                    code: error.code,
               });

               if (retries < this.maxRetries - 1) {
                    const delay = Math.pow(2, retries) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.sendWithRetry(msg, retries + 1);
               }

               throw error;
          }
     }

     async sendWelcomeEmail(email, firstName) {
          const msg = {
               to: email,
               from: this.from,
               subject: 'Welcome to Evently - Email Verified',
               html: getWelcomeTemplate(firstName),
          };

          return this.sendWithRetry(msg);
     }

     async sendBookingConfirmedEmail(email, bookingData) {
          const msg = {
               to: email,
               from: this.from,
               subject: `Booking Confirmed - ${bookingData.trainName || 'Your Train Ticket'}`,
               html: getBookingConfirmedTemplate(bookingData),
          };

          return this.sendWithRetry(msg);
     }

     async sendBookingFailedEmail(email, bookingData) {
          const msg = {
               to: email,
               from: this.from,
               subject: 'Booking Unsuccessful - Please Try Again',
               html: getBookingFailedTemplate(bookingData),
          };

          return this.sendWithRetry(msg);
     }

     async sendBookingCancelledEmail(email, bookingData) {
          const msg = {
               to: email,
               from: this.from,
               subject: 'Booking Cancelled - Refund Update',
               html: getBookingCancelledTemplate(bookingData),
          };

          return this.sendWithRetry(msg);
     }
}

export default new EmailService();
