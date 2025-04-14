// Create a simplified logger that's compatible with Edge Runtime
import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Define custom type for DailyRotateFile transport
import { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';

// Remove problematic module augmentation
// We'll handle the types with casting instead

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

// Get log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  // Use DEBUG level in development, otherwise use the configured level
  return env === 'development' ? 'debug' : logLevel;
};

// Format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define a conditional logger depending on the environment
let logger: winston.Logger;

// Use a simple console transport in edge runtime
const isEdgeRuntime = typeof window === 'undefined' && typeof global !== 'undefined' && !global.process?.versions?.node;
const isServerSideRendering = typeof window === 'undefined' && !isEdgeRuntime;

// Create a basic console-based logger for Edge runtime
if (isEdgeRuntime) {
  // Creating a minimal logger for Edge Runtime
  const createConsoleLogger = () => {
    return {
      error: (message: string) => console.error(`[ERROR] ${message}`),
      warn: (message: string) => console.warn(`[WARN] ${message}`),
      info: (message: string) => console.info(`[INFO] ${message}`),
      http: (message: string) => console.log(`[HTTP] ${message}`),
      debug: (message: string) => console.debug(`[DEBUG] ${message}`),
    };
  };
  
  // @ts-ignore - We're creating a simple object for Edge compatibility
  logger = createConsoleLogger();
} else {
  // Create the standard Winston logger for Node.js environment
  const logDir = path.join(process.cwd(), 'logs');

  // Define log formats
  const formats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ];

  // Configure daily rotate file transport for production
  const fileRotateTransport = new (winston.transports as any).DailyRotateFile({
    dirname: logDir,
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  });

  logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format: winston.format.combine(...formats),
    defaultMeta: { service: 'lamontai' },
    transports: [
      // Write logs with level 'error' and below to error.log
      // Write all logs to console in development
      process.env.NODE_ENV === 'production'
        ? fileRotateTransport
        : new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
              )
            ),
          }),
    ],
    exceptionHandlers: [
      process.env.NODE_ENV === 'production'
        ? new (winston.transports as any).DailyRotateFile({
            dirname: logDir,
            filename: 'exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
          })
        : new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
              )
            ),
          }),
    ],
    rejectionHandlers: [
      process.env.NODE_ENV === 'production'
        ? new (winston.transports as any).DailyRotateFile({
            dirname: logDir,
            filename: 'rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
          })
        : new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
              )
            ),
          }),
    ],
  });
  
  // Add file transports in production server environment (not in Edge)
  if (isServerSideRendering && process.env.NODE_ENV === 'production') {
    try {
      // We'll skip the dynamic file logging setup to avoid type compatibility issues
      console.log('File logging disabled due to type compatibility issues');
    } catch (e) {
      console.warn('Error setting up file transports:', e);
    }
  }
}

/**
 * Stream for Morgan HTTP request logger (only used in Node.js environment)
 */
export const stream = {
  write: (message: string) => {
    if (typeof logger.http === 'function') {
      logger.http(message.trim());
    } else {
      console.log(`[HTTP] ${message.trim()}`);
    }
  },
};

// Export a more convenient API
export default {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
}; 