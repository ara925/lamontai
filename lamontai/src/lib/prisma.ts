import { PrismaClient } from '@prisma/client';
// Import our driver adapter
import { createNeonAdapter } from './driver-adapters/prisma-neon';

// Check if we're running in a build environment
const isBuildEnvironment = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV && !process.env.NEXT_PUBLIC_DEPLOY_ENV;

// Edge Runtime compatibility
const isEdgeRuntime = () => {
  return process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' || 
         process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === 'true' ||
         process.env.NEXT_RUNTIME === 'edge' || 
         typeof (global as any).EdgeRuntime !== 'undefined';
};

// Mock Prisma for build environments to avoid engine discovery issues
const createMockPrismaClient = () => {
  console.log('Creating mock Prisma client for build environment');
  const mockHandler = {
    get: () => {
      return async () => [];
    }
  };
  return new Proxy({}, mockHandler);
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a client with edge compatibility
const createPrismaClient = () => {
  // If we're in a build environment, use mock client
  if (isBuildEnvironment) {
    return createMockPrismaClient() as unknown as PrismaClient;
  }

  if (isEdgeRuntime()) {
    // For Edge Runtime (Cloudflare), use our adapter
    try {
      // Create adapter
      const adapter = createNeonAdapter();
      
      // Use adapter with Prisma client
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('Failed to create Edge-compatible Prisma client, falling back to regular client:', e);
      console.warn('Using mock Prisma client - database operations will not work');
      return createMockPrismaClient() as unknown as PrismaClient;
    }
  } else {
    // Regular environment
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
};

// Export a client singleton
const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 