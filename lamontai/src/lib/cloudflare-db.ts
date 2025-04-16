/**
 * Cloudflare-optimized database connection using Neon PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

// Initialize client with Neon adapter when in Cloudflare environment
// This file is used when the app is deployed to Cloudflare
let prisma: PrismaClient | undefined;

export async function getCloudflareClient(): Promise<PrismaClient> {
  if (!prisma) {
    try {
      // Dynamically import modules needed for Cloudflare
      const { neon } = await import('@neondatabase/serverless');
      const { PrismaNeon } = await import('@prisma/adapter-neon');
      
      // Get connection string from environment
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      // Create Neon SQL connection
      const sql = neon(connectionString);
      
      // Create Prisma client with Neon adapter
      prisma = new PrismaClient({
        // @ts-ignore - Type issues with the Neon adapter
        adapter: new PrismaNeon({ connectionString }),
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });
    } catch (error) {
      console.error('Failed to initialize Neon database client:', error);
      throw error;
    }
  }
  
  return prisma;
}

/**
 * Close database connections gracefully
 */
export async function closeConnection(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
} 