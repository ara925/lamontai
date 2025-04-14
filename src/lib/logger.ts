// Simple logger implementation to avoid Edge Runtime compatibility issues
import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Basic logger configuration
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'lamontai' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
  ],
});

// Function to safely enable file logging in server environments only
const setupFileLogging = () => {
  // Skip in browser or Edge environment
  if (typeof window !== 'undefined' || typeof process === 'undefined') {
    return;
  }

  try {
    // This would normally use winston-daily-rotate-file
    // But we'll use a simple file transport to avoid Edge compatibility issues
    const fs = require('fs');
    const logDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFilePath = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    const errorFilePath = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    
    // Add basic file transports
    logger.add(new winston.transports.File({
      filename: logFilePath,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }));
    
    logger.add(new winston.transports.File({
      filename: errorFilePath,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }));
    
    logger.info('File logging enabled');
  } catch (error) {
    console.error('Failed to set up file logging:', error);
  }
};

// Set up file logging in production and on server only
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  setupFileLogging();
}

// Logger API
const loggerAPI = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};

export default loggerAPI;

// Stream for Morgan HTTP request logger (server only)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
}; 