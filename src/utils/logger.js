const winston = require('winston');
const config = require('./config');

// Configure different log levels based on environment
const level = config.server.nodeEnv === 'production' ? 'info' : 'debug';

// Define custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message} ${stack || ''}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level,
  format: customFormat,
  transports: [
    // Console transport for all environments
    new winston.transports.Console(),
    
    // File transport only for production
    ...(config.server.nodeEnv === 'production' 
      ? [
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log' 
          })
        ] 
      : [])
  ],
});

module.exports = logger;