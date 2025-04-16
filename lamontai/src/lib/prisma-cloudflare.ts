/**
 * Prisma client implementation optimized for Cloudflare and Edge environments
 * This implementation now uses the Neon Driver Adapter for Edge compatibility
 */

// Import standard client and adapter
import { PrismaClient } from '@prisma/client';
// Removed: import { PrismaClient as EdgePrismaClient } from '@prisma/client/edge';
// Removed: import { withAccelerate } from "@prisma/extension-accelerate";
import { createNeonAdapter } from './driver-adapters/prisma-neon';

// Use a more reliable caching mechanism that works in edge environments
declare global {
  // Use standard PrismaClient type as adapter works universally
  var prismaGlobal: PrismaClient | undefined;
}

// Edge-safe method to get globals
const getGlobalThis = () => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  throw new Error('Unable to locate global object');
};

// Function to check if we're running in an edge environment
const isEdgeRuntime = () => {
  try {
    return process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' || 
           process.env.NEXT_RUNTIME === 'edge' ||
           // Check for edge runtime in a more compatible way
           typeof (globalThis as any).EdgeRuntime !== 'undefined';
  } catch (e) {
    // If process is not defined, we're likely in an edge environment
    return true;
  }
};

// Function to check if we're running on Windows
const isWindowsEnvironment = () => {
  try {
    return process.platform === 'win32';
  } catch (e) {
    // In edge runtime, this may fail
    return false;
  }
};

/**
 * Create a mock Prisma client for fallback situations
 * This prevents crashes when the real client can't be instantiated
 */
function createMockPrismaClient(): any {
  console.warn('Using mock Prisma client - database operations will not work');
  const handler = {
    get: (_target: any, prop: string) => {
      if (prop === '$connect' || prop === '$disconnect') {
        return () => Promise.resolve();
      }
      return new Proxy({}, {
        get: (_: any, operation: string) => {
          return (...args: any[]) => {
            console.log(`Mock DB operation: ${prop}.${operation}`, args);
            if (operation === 'findMany') return Promise.resolve([]);
            if (operation === 'findUnique' || operation === 'findFirst') return Promise.resolve(null);
            if (operation === 'create' || operation === 'update') return Promise.resolve({ id: 'mock-id', ...args[0]?.data });
            return Promise.resolve(null);
          };
        }
      });
    }
  };
  return new Proxy({} as any, handler);
}

/**
 * Get the Prisma client instance using the Neon Driver Adapter.
 * This function should work in both edge and node environments.
 */
export function getPrismaWithAdapter(): PrismaClient {
  const globalThis = getGlobalThis() as any;
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }

  try {
    console.log("Initializing Prisma Client with Neon Driver Adapter...");
    const adapter = createNeonAdapter();
    const prisma = new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
     });

    if (process.env.NODE_ENV !== 'production') {
      globalThis.prismaGlobal = prisma;
    }
    return prisma;
  } catch (error) {
    console.error('Failed to create Prisma client with Neon adapter:', error);
    // Fallback to mock client
    return createMockPrismaClient() as PrismaClient;
  }
}

/**
 * Handle cleanup of Prisma client (Adapter might handle pooling differently)
 * Note: Explicit disconnect might not be needed or supported by the adapter's pool.
 * Refer to adapter documentation if issues arise.
 */
export async function disconnectPrisma(): Promise<void> {
  const globalThis = getGlobalThis() as any;
  if (globalThis.prismaGlobal && globalThis.prismaGlobal.$disconnect) {
    try {
        console.log("Attempting to disconnect prismaGlobal (Adapter behavior may vary)...");
        // The adapter might manage the underlying pool closure differently.
        // Calling $disconnect on the client might be a no-op or throw if not implemented.
        await globalThis.prismaGlobal.$disconnect(); 
    } catch (e) {
        console.warn("Failed to disconnect prismaGlobal instance (might be expected with adapter):", e);
    }
    globalThis.prismaGlobal = undefined;
  }
}

/**
 * Get the appropriate Prisma client based on the environment - Now always returns the adapter version.
 * Renamed for clarity.
 */
// export function getPrismaForEnvironment(): PrismaClient { // Renamed function
//   // Logic simplified - always use the adapter
//   return getPrismaWithAdapter();
// }

// Export the main function for direct use
export { getPrismaWithAdapter as getPrismaForEnvironment }; 