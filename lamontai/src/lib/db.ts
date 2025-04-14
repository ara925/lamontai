/**
 * Database connection management
 * Automatically selects the appropriate connection based on environment
 */

import { PrismaClient } from '@prisma/client'

// Set up global type for PrismaClient with all needed global variables
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
  var dbPrisma: PrismaClient | undefined;
}

// Simple DB mock for development and testing
// This avoids Edge Runtime issues in Next.js
// Define the mock database client
export const dbMock = {
  // Mock user operations
  user: {
    findUnique: async ({ where }: { where: any }) => {
      console.log('Mock DB: findUnique called with:', where);
      return null; // Simulate user not found
    },
    create: async ({ data }: { data: any }) => {
      console.log('Mock DB: create called with:', data);
      return { ...data, id: 'mock-user-id' }; // Return mock user
    }
  },
  
  // Mock connection functions
  $connect: async () => {
    console.log('Mock DB: connect called');
    return Promise.resolve();
  },
  
  $disconnect: async () => {
    console.log('Mock DB: disconnect called');
    return Promise.resolve();
  },
  
  $transaction: async (callback: (tx: any) => Promise<any>) => {
    console.log('Mock DB: transaction called');
    // Simple pass-through transaction that just calls the callback with the mock db
    return callback(dbMock);
  }
};

// Function to initialize the PrismaClient with appropriate configuration
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
}

// Use a singleton pattern to prevent multiple instances in development
let prisma: PrismaClient;

// Check if we're in production to avoid multiple connections during hot reload
if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // In development, use the global variable if available
  if (!global._prisma) {
    global._prisma = createPrismaClient();
  }
  prisma = global._prisma;
}

// Utility functions for the database
export async function ensureDatabaseConnection(): Promise<void> {
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('Using mock database instead');
    return;
  }
}

export { prisma };

// Environment-specific client selection
// For backward compatibility with existing code
export const db = process.env.NODE_ENV === 'development' ? dbMock : prisma;

export const dbUtils = {
  ensureConnection: ensureDatabaseConnection
};

/**
 * Initialize the database connection
 * Call this in your app initialization to ensure the database is ready
 */
export async function initializeDatabase() {
  try {
    await ensureDatabaseConnection();
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Cloudflare-specific database client handling
let cloudflareDb: any = null;

/**
 * Get the appropriate database client based on the current environment
 * This is specifically designed to handle Cloudflare edge runtime
 */
export async function getDatabaseClient() {
  // For Cloudflare Workers/Pages environment
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare') {
    try {
      if (!cloudflareDb) {
        // Dynamically import Cloudflare-specific client to avoid Node.js dependencies
        // in the Edge runtime
        const { getPrismaClient } = await import('./prisma-cloudflare');
        cloudflareDb = getPrismaClient();
      }
      return cloudflareDb;
    } catch (error) {
      console.error('Failed to load Cloudflare database client:', error);
      // Fall back to mock for safety in Cloudflare environment
      return dbMock;
    }
  }
  
  // For standard Node.js environment (non-Cloudflare)
  return db;
}

// Default export
export default { db, prisma, dbMock, getDatabaseClient }; 