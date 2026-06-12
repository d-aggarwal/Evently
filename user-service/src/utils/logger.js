import winston from 'winston'

const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     defaultMeta: {service: 'User-Service'},
     format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({level, message, timestamp, service}) =>{
               return `[${timestamp}] [${level}] [${service}]: ${message}`
          })
     ),
     transports: [new winston.transports.Console()]
})

export default logger