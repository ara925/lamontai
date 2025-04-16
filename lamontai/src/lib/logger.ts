/**
 * Edge-compatible logger implementation
 * Works in both Node.js and Edge Runtime environments
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level (for Node.js console output)
const colors = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m',  // yellow
  info: '\x1b[32m',  // green
  http: '\x1b[35m',  // magenta
  debug: '\x1b[34m', // blue
  reset: '\x1b[0m',  // reset
};

// Get current log level from environment or default to info
const getLogLevel = () => {
  if (typeof process !== 'undefined' && process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'development' ? 'debug' : 'info';
};

// Determine if we're in an Edge Runtime environment
const isEdgeRuntime = () => {
  return typeof process !== 'undefined' && 
         (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' || 
          process.env.NEXT_PUBLIC_EDGE_RUNTIME === 'edge');
};

// Determine if we're in a browser environment
const isBrowser = () => {
  return typeof window !== 'undefined';
};

// Simple implementation that works in all environments
class EdgeCompatibleLogger {
  private level: string;
  private service: string;

  constructor(service = 'lamontai') {
    this.level = getLogLevel();
    this.service = service;
  }

  // Format a log message
  private format(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.service}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  // Determines if a message at the given level should be logged
  private shouldLog(level: string): boolean {
    return levels[level as keyof typeof levels] <= levels[this.level as keyof typeof levels];
  }

  // Log to the appropriate output based on environment
  private log(level: string, message: string, meta?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.format(level, message, meta);
    
    // In the browser, use console methods
    if (isBrowser()) {
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'debug':
        case 'http':
        default:
          console.log(formattedMessage);
          break;
      }
      return;
    }

    // In Node.js (not Edge), we can use colored output
    if (!isEdgeRuntime()) {
      const color = colors[level as keyof typeof colors] || '';
      console.log(`${color}${formattedMessage}${colors.reset}`);
      
      // Log to file only in Node.js server environment (not in Edge)
      if (typeof process !== 'undefined' && 
          process.env.NODE_ENV === 'production' && 
          !isBrowser() && 
          !isEdgeRuntime()) {
        
        // In a full Node.js environment, we could call file logging
        // but we'll skip this in production builds to avoid edge compatibility issues
        // To be implemented with a dynamic import in a server-only context
        console.log('File logging available in full Node.js environment');
      }
      return;
    }

    // In Edge Runtime, use plain console.log
    console.log(formattedMessage);
  }

  // Public methods
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  http(message: string, meta?: any): void {
    this.log('http', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }
}

// Create and export a singleton instance
const logger = new EdgeCompatibleLogger();

// Export the logger API
export default logger;

// Stream for HTTP request logging (for Node.js only)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
}; 