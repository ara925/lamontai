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
    throw new Error('Failed to connect to the database');
  }
}

export { prisma };

// For backward compatibility with existing code
export const db = prisma;
export const dbUtils = {
  ensureConnection: ensureDatabaseConnection
};

// Add additional domain-specific database helpers below if needed

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

// Environment-specific imports
let cloudflareDb: any;

// Initialize database connection based on environment
export async function getDatabaseClient() {
  // For Cloudflare environment
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare') {
    try {
      // Dynamically import Cloudflare-specific client
      const { getPrismaClient } = await import('./prisma-cloudflare');
      return getPrismaClient();
    } catch (error) {
      console.error('Failed to load Cloudflare database client:', error);
      throw new Error('Failed to initialize Cloudflare database connection');
    }
  }
  
  // For regular environments (development, production on non-Cloudflare)
  if (process.env.NODE_ENV === 'production') {
    // In production, don't use global cache
    return new PrismaClient();
  }
  
  // In development, cache the client to prevent too many connections
  if (!global.dbPrisma) {
    global.dbPrisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  
  return global.dbPrisma;
}

// Default export for easy import
export default { getDatabaseClient }; 