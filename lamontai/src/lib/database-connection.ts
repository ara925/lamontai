import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Database connection configuration
 */
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MAX_RETRIES = 5;

/**
 * Delay helper function for connection retries
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Global PrismaClient instance with connection pooling and logging
 */
declare global {
  // Use a different name to avoid redeclaration conflicts
  var dbPrisma: PrismaClient | undefined;
}

/**
 * Configure Prisma with connection pooling and logging
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
    // Connection pooling settings
    log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    // Add query performance logging
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        try {
          const result = await query(args);
          const end = performance.now();
          const duration = end - start;
          
          // Log slow queries (over 300ms) for investigation
          if (duration > 300) {
            logger.warn(`Slow query detected: ${operation} on ${model} took ${duration.toFixed(2)}ms`);
          }
          
          return result;
        } catch (error) {
          // Log database errors
          logger.error(`Database error in ${operation} on ${model}: ${(error as Error).message}`);
          throw error;
        }
      }
    },
  });
};

/**
 * Use a singleton pattern to ensure we don't create multiple instances in development
 */
const globalForPrisma = globalThis as unknown as { dbPrisma: PrismaClient };
export const db = globalForPrisma.dbPrisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.dbPrisma = db;

/**
 * Ensure the database connection is established with retry logic
 */
export async function ensureDatabaseConnection(): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Try to connect to the database
      await db.$connect();
      
      // Test the connection with a simple query
      await db.$queryRaw`SELECT 1`;
      
      logger.info(`Database connection established successfully`);
      return true;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt + 1}/${MAX_RETRIES} failed: ${(error as Error).message}`);
      
      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
      }
      
      // Exponential backoff with jitter
      const backoff = Math.min(Math.pow(2, attempt) * 1000 + Math.random() * 1000, 10000);
      logger.info(`Retrying database connection in ${Math.round(backoff)}ms...`);
      await delay(backoff);
    }
  }
  
  return false;
}

/**
 * Execute a database operation with retry logic for transient errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  retryableErrors = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2025', 'P2028']
): Promise<T> {
  // Initialize lastError with a default error to fix the "used before assigned" error
  let lastError: Error = new Error('Unknown database error');
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if the error is retryable
      const isPrismaError = error instanceof Error && 'code' in (error as any);
      const errorCode = isPrismaError ? (error as any).code : '';
      const isRetryable = retryableErrors.includes(errorCode);
      
      if (attempt < retries && isRetryable) {
        // Exponential backoff with jitter
        const backoff = Math.min(Math.pow(2, attempt) * 200 + Math.random() * 100, 2000);
        logger.warn(`Retryable database error (${errorCode}), retrying in ${Math.round(backoff)}ms: ${(error as Error).message}`);
        await delay(backoff);
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Handle common database operations with error handling and retry logic
 */
export const dbUtils = {
  async findUnique<T>(
    model: string,
    operation: () => Promise<T | null>,
    notFoundMessage = 'Resource not found'
  ): Promise<T> {
    try {
      const result = await withRetry(operation);
      
      if (!result) {
        throw new Error(`${notFoundMessage} (${model})`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Database findUnique error on ${model}: ${(error as Error).message}`);
      throw error;
    }
  },
  
  async findMany<T>(
    model: string,
    operation: () => Promise<T[]>
  ): Promise<T[]> {
    try {
      return await withRetry(operation);
    } catch (error) {
      logger.error(`Database findMany error on ${model}: ${(error as Error).message}`);
      throw error;
    }
  },
  
  async create<T>(
    model: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await withRetry(operation);
    } catch (error) {
      logger.error(`Database create error on ${model}: ${(error as Error).message}`);
      throw error;
    }
  },
  
  async update<T>(
    model: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await withRetry(operation);
    } catch (error) {
      logger.error(`Database update error on ${model}: ${(error as Error).message}`);
      throw error;
    }
  },
  
  async delete<T>(
    model: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await withRetry(operation);
    } catch (error) {
      logger.error(`Database delete error on ${model}: ${(error as Error).message}`);
      throw error;
    }
  },
}; 