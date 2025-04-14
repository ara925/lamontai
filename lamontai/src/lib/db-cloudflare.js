/**
 * Cloudflare-optimized database connection using Neon PostgreSQL
 */

import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';

// Use pool and connection caching for optimal performance in Cloudflare environment
let prisma;
let pool;

/**
 * Initialize database connection for Cloudflare environment
 */
export function getPrismaClient() {
  if (!prisma) {
    // Get connection string from environment
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create connection pool optimized for serverless
    pool = new Pool({ 
      connectionString,
      // Configure connection pool for serverless
      maxConns: 10,
      idleTimeoutMs: 30000,
    });
    
    // Create Prisma client with Neon adapter
    prisma = new PrismaClient({
      adapter: new PrismaNeon(pool),
      // Log queries in development
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
    
    // Handle connection issues
    pool.on('error', (err) => {
      console.error('Neon pool error:', err);
      // Reset the client on connection errors
      prisma = null;
      pool = null;
    });
  }
  
  return prisma;
}

/**
 * Gracefully close database connections
 */
export async function disconnectDb() {
  if (prisma) {
    await prisma.$disconnect();
  }
  
  if (pool) {
    await pool.end();
  }
  
  prisma = null;
  pool = null;
}

// Export singleton instance
export default getPrismaClient(); 