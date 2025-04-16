/**
 * Edge-compatible Prisma client adapter for Neon serverless Postgres
 * This implements the @prisma/driver-adapters interface for edge compatibility
 */

import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// Global connection pool for reuse
// let globalPool: Pool | null = null; // No longer needed

/**
 * Get Neon connection pool (singleton pattern)
 */
// export function getNeonPool(): Pool { // No longer needed
//   if (globalPool) return globalPool;
//   
//   const connectionString = process.env.DATABASE_URL;
//   if (!connectionString) {
//     throw new Error('DATABASE_URL environment variable is not defined');
//   }
//   
//   globalPool = new Pool({ connectionString });
//   return globalPool;
// }

/**
 * Create Prisma client adapter for Neon in edge environments
 */
export function createNeonAdapter() {
  // const pool = getNeonPool(); // No longer creating pool instance here
  // return new PrismaNeon(pool);
  
  // Get connection string
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined for PrismaNeon adapter');
  }
  
  // Pass connection string object directly to adapter
  return new PrismaNeon({ connectionString });
}

/**
 * Close the Neon connection pool
 * Important to call this when done to avoid connection leaks
 */
// export async function closeNeonPool(): Promise<void> { // No longer needed
//   if (globalPool) {
//     await globalPool.end();
//     globalPool = null;
//   }
// }

// Default export for convenience
// Remove getNeonPool and closeNeonPool if they were exported here
export default { createNeonAdapter }; 