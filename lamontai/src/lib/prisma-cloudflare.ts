/**
 * Prisma client implementation specifically for Cloudflare environment
 * This implementation works around limitations in the Cloudflare Workers
 * and Pages environments.
 */

import { PrismaClient } from '@prisma/client';

// Custom Prisma client for Cloudflare environment
let prismaClient: PrismaClient | null = null;

/**
 * Get a Prisma client instance configured for Cloudflare
 */
export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  // Create a new PrismaClient with DataProxy for Cloudflare compatibility
  prismaClient = new PrismaClient({
    // Cloudflare-compatible configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  return prismaClient;
}

/**
 * Handle cleanup of Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

// Export a wrapped client for direct usage
export const prisma = getPrismaClient(); 