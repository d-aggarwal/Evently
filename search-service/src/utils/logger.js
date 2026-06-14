import winston from 'winston'

const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     defaultMeta: {service: 'Search-Service'},
     format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({level, message, timestamp, service, error, stack, ...meta}) =>{
               let output = `[${timestamp}] [${level}] [${service}]: ${message}`;
               if (error) {
                    output += ` | ${error}`;
               }
               if (stack) {
                    output += ` | ${stack}`;
               }
               if (Object.keys(meta).length > 0) {
                    output += ` | ${JSON.stringify(meta)}`;
               }
               return output;
          })
     ),
     transports: [new winston.transports.Console()]
})

export default logger