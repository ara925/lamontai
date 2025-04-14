/**
 * Prisma client implementation specifically for Cloudflare environment
 * This implementation works with Neon PostgreSQL for Edge compatibility
 */

import { PrismaClient } from '@prisma/client';

// Cached client - important for serverless environments
let prismaGlobal: PrismaClient | null = null;

/**
 * Get a Prisma client instance configured for Cloudflare
 * Uses connection pooling to optimize for serverless environment
 */
export function getPrismaClient(): PrismaClient {
  if (prismaGlobal) {
    return prismaGlobal;
  }

  // Create a new PrismaClient with optimized configuration for Cloudflare
  const prisma = new PrismaClient({
    // Log queries only in development
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    
    // Configure data source with environment variables
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Cache the client
  prismaGlobal = prisma;
  return prisma;
}

/**
 * Get a Prisma client configured for Neon serverless PostgreSQL
 * This is optimized for Cloudflare Workers and Edge runtime
 */
export async function getNeonPrismaClient() {
  // In development mode, reuse the cached client if available
  if (process.env.NODE_ENV !== 'production' && prismaGlobal) {
    return prismaGlobal;
  }
  
  try {
    // Edge runtime requires dynamic imports
    if (process.env.NODE_ENV === 'production') {
      // Dynamically import the Neon modules for Edge compatibility
      const { neon } = await import('@neondatabase/serverless');
      const { PrismaNeonHTTP } = await import('@prisma/adapter-neon');
      
      // Get database URL from environment
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL is not defined');
      }
      
      // Create a Neon SQL connection
      const sql = neon(connectionString);
      
      // Create a new PrismaClient with Neon adapter
      return new PrismaClient({
        // @ts-ignore - The type definitions may have issues with the adapter
        adapter: new PrismaNeonHTTP(sql),
      });
    } else {
      // For development, use the standard Prisma client and cache it
      prismaGlobal = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: ['error', 'warn'],
      });
      
      return prismaGlobal;
    }
  } catch (error) {
    console.error('Error initializing Prisma client for Cloudflare:', error);
    throw error;
  }
}

/**
 * Handle cleanup of Prisma client
 * Important for serverless environments to prevent connection leaks
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaGlobal) {
    await prismaGlobal.$disconnect();
    prismaGlobal = null;
  }
}

/**
 * Get the appropriate Prisma client based on the environment
 */
export async function getPrismaForEnvironment(): Promise<PrismaClient> {
  // For Cloudflare environment, use the Neon adapter
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare') {
    return getNeonPrismaClient();
  }
  
  // For other environments, use the standard Prisma client
  return getPrismaClient();
}

/**
 * Close the Prisma client connection
 * This is important in edge functions to avoid connection leaks
 */
export async function closePrismaClient(client: PrismaClient) {
  if (process.env.NODE_ENV === 'production') {
    try {
      await client.$disconnect();
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
  }
}

// Default export for convenience
export const prisma = getPrismaClient(); 