import winston from 'winston';
import path from 'path';

/**
 * Create a Winston logger with custom configuration
 */
export const createLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
    )
  );

  // Determine the log level from environment or default to 'info'
  const logLevel = process.env.LOG_LEVEL || 'info';

  // Create log directory if it doesn't exist
  const logDir = path.join(process.cwd(), 'logs');

  // Create the logger
  const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'lamontai-api' },
    transports: [
      // Console transport for all environments
      new winston.transports.Console({
        format: consoleFormat
      })
    ]
  });

  // Add file transports in production mode
  if (process.env.NODE_ENV === 'production') {
    logger.add(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
    
    logger.add(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  return logger;
};

// Create a default logger instance
const logger = createLogger();

export default logger; 