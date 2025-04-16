/**
 * Database client abstraction layer
 * This module provides a unified API for accessing the database in any environment
 */

import { PrismaClient } from '@prisma/client'
import { getPrismaForEnvironment } from './prisma-cloudflare'

// Conditionally import mock dependencies only in test environment
// This prevents build errors when jest-mock-extended is not available
let mockDeep: any = () => ({});
let mockReset: any = () => {};
let DeepMockProxy: any;

// Only attempt to import jest-mock-extended in test environment
if (process.env.NODE_ENV === 'test') {
  try {
    // Dynamic import to avoid issues in non-test environments
    const jestMockExtended = require('jest-mock-extended');
    mockDeep = jestMockExtended.mockDeep;
    mockReset = jestMockExtended.mockReset;
    DeepMockProxy = jestMockExtended.DeepMockProxy;
  } catch (e) {
    console.log('jest-mock-extended not available, using mock functions');
  }
}

/**
 * Check if we're in the Edge Runtime based on environment variables
 */
const isEdgeRuntime = () => {
  try {
    return process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' || 
           process.env.NEXT_RUNTIME === 'edge' || 
           typeof (global as any).EdgeRuntime !== 'undefined';
  } catch (e) {
    // If process is not defined, we're likely in an edge environment
    return true;
  }
}

/**
 * Check if we're in a build environment
 */
const isBuildTime = () => {
  try {
    return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';
  } catch (e) {
    // If there's an error accessing process, we're not in build time
    return false;
  }
}

/**
 * Augment global scope with prisma client for development
 */
declare global {
  var prisma: PrismaClient | undefined
}

// For testing - mock client
export type MockPrismaClient = any
export const prismaMock = typeof mockDeep === 'function' ? mockDeep() : {} as PrismaClient
export const resetMocks = () => typeof mockReset === 'function' && mockReset(prismaMock)

// Global references for singleton pattern
let prismaClientSingleton: PrismaClient | null = null;
let prismaClientBuild: any | undefined;

/**
 * Create a mock client that doesn't throw errors
 */
const createMockClient = () => {
  const handler = {
    get: function(target: any, prop: string) {
      // Handle special methods
      if (prop === 'connect' || prop === 'disconnect' || prop === '$connect' || prop === '$disconnect') {
        return () => Promise.resolve()
      }
      
      // For model operations, return a proxy that handles operations
      return new Proxy({}, {
        get: function(_: any, operation: string | symbol) {
          return (...args: any[]) => {
            console.log(`Mock DB operation: ${prop}.${String(operation)}`, args)
            // Return empty arrays for findMany, null for findUnique/findFirst
            if (String(operation) === 'findMany') {
              return Promise.resolve([])
            } else if (String(operation) === 'findUnique' || String(operation) === 'findFirst') {
              return Promise.resolve(null)
            } else if (String(operation) === 'create' || String(operation) === 'update' || String(operation) === 'upsert') {
              // Return a mock object for mutations
              return Promise.resolve({ id: 'mock-id', ...args[0]?.data })
            } else if (String(operation) === 'count') {
              return Promise.resolve(0)
            } else {
              return Promise.resolve(null)
            }
          }
        }
      })
    }
  }
  
  return new Proxy({}, handler)
}

/**
 * Create a database client appropriate for the current environment
 */
const createPrismaClient = async (): Promise<PrismaClient> => {
  // For tests, return the mock
  if (process.env.NODE_ENV === 'test') {
    return prismaMock
  }

  // For build time - avoid actual DB connections
  if (isBuildTime()) {
    if (!prismaClientBuild) {
      prismaClientBuild = createMockClient()
    }
    return prismaClientBuild
  }

  // Return existing client if available
  if (prismaClientSingleton) {
    return prismaClientSingleton
  }
  
  try {
    // Use getPrismaForEnvironment which will handle both edge and non-edge environments
    prismaClientSingleton = await getPrismaForEnvironment();
    return prismaClientSingleton;
  } catch (e) {
    console.error('Error creating Prisma client:', e)
    // Return a mock client as fallback
    return createMockClient() as unknown as PrismaClient
  }
}

// Initialize client carefully to prevent errors during build
let dbClientPromise: Promise<PrismaClient>;

try {
  // Only create a real client outside of build time
  if (typeof globalThis !== 'undefined' && !isBuildTime()) {
    if (globalThis.prisma) {
      dbClientPromise = Promise.resolve(globalThis.prisma);
    } else {
      dbClientPromise = createPrismaClient();
      
      // Cache the client in globalThis for development
      if (process.env.NODE_ENV !== 'production') {
        dbClientPromise.then(client => {
          globalThis.prisma = client;
        });
      }
    }
  } else {
    dbClientPromise = Promise.resolve(createMockClient() as unknown as PrismaClient);
  }
} catch (e) {
  console.error('Error initializing Prisma client:', e);
  dbClientPromise = Promise.resolve(createMockClient() as unknown as PrismaClient);
}

// Export the client - this is now a promise but we maintain the same API
// export const db = await dbClientPromise; // REMOVED top-level await export

// Helper to ensure DB is connected before operations
export async function ensureDbConnected() {
  if (process.env.NODE_ENV === 'test' || isBuildTime()) {
    // No real connection needed for tests/build
    return Promise.resolve()
  }

  try {
    const db = await getDatabaseClient(); // Get the client instance
    // @ts-ignore - connection methods might not be available on all clients
    if (db && db.$connect) { // Check if db exists and has $connect
      await db.$connect()
    }
    return Promise.resolve()
  } catch (error) {
    console.error('Error connecting to database:', error)
    return Promise.reject(error)
  }
}

// Initialize database (useful for middleware/setup)
export async function initializeDb() {
  const db = await getDatabaseClient(); // Await the getter here
  await ensureDbConnected() // This might need adjustment if ensureDbConnected expects the client directly
  console.log('Database initialized')
  return db
}

// Get the appropriate database client based on the current environment
export async function getDatabaseClient(): Promise<PrismaClient> {
  // Return the promise, let the caller await
  return dbClientPromise;
}

// Default export
// export default { db, getDatabaseClient }; // Remove db from default export
export default { getDatabaseClient }; 