/**
 * Cloudflare-optimized database connection using Neon PostgreSQL
 * TypeScript version with proper type definitions
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';

// We need to use dynamic imports for adapter-neon since it's ESM only
let PrismaNeon: any;

// Global type for the prisma client
declare global {
  var prisma: PrismaClient | undefined;
}

// Define types
interface NeonPoolOptions {
  connectionString: string;
  maxConns?: number;
  idleTimeoutMs?: number;
}

// Initialize singletons for connection pooling
let prisma: PrismaClient;
let pool: Pool;

/**
 * Initialize database connection for Cloudflare environment
 */
export async function getPrismaClient(): Promise<PrismaClient> {
  // Use cached client if available
  if (global.prisma) {
    return global.prisma;
  }
  
  if (!prisma) {
    try {
      // Dynamically import PrismaNeon adapter
      const adapterModule = await import('@prisma/adapter-neon');
      PrismaNeon = adapterModule.PrismaNeon;
      
      // Get connection string from environment
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      // Create connection pool optimized for serverless
      const poolOptions: NeonPoolOptions = { 
        connectionString,
        maxConns: 10,
        idleTimeoutMs: 30000,
      };
      
      pool = new Pool(poolOptions);
      
      // Create Prisma client with Neon adapter
      prisma = new PrismaClient({
        adapter: new PrismaNeon(pool),
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });
      
      // Handle connection issues
      pool.on('error', (err: Error) => {
        console.error('Neon pool error:', err);
        // Reset the client on connection errors
        prisma = undefined as any;
        pool = undefined as any;
        global.prisma = undefined;
      });
      
      // Use globalThis to cache the connection
      if (process.env.NODE_ENV !== 'production') {
        global.prisma = prisma;
      }
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error);
      throw error;
    }
  }
  
  return prisma;
}

/**
 * Gracefully close database connections
 */
export async function disconnectDb(): Promise<void> {
  try {
    if (prisma) {
      await prisma.$disconnect();
    }
    
    if (pool) {
      await pool.end();
    }
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  } finally {
    prisma = undefined as any;
    pool = undefined as any;
    global.prisma = undefined;
  }
}

// Default export for direct import
export default { getPrismaClient, disconnectDb }; 