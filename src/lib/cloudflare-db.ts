/**
 * Cloudflare-compatible database client
 * Uses Prisma's Neon adapter for serverless environments
 */

// Import types only to avoid actual imports in Edge Runtime
import type { PrismaClient } from '@prisma/client';

// Singleton instance for Cloudflare environment
let cloudflareClient: any = null;

/**
 * Initialize the database client for Cloudflare environment
 * Uses dynamic imports to avoid loading modules until they're needed
 */
export async function getCloudflareClient(): Promise<any> {
  if (cloudflareClient) {
    return cloudflareClient;
  }
  
  try {
    // Dynamically import dependencies
    const { PrismaClient } = await import('@prisma/client');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { PrismaNeon } = await import('@prisma/adapter-neon');
    
    // Try to load ws for WebSocket polyfill
    let ws;
    try {
      ws = await import('ws');
    } catch (error) {
      // ws may not be available in all environments, fallback to native WebSocket
      console.log('ws module not available, using native WebSocket if available');
    }

    // WebSocket polyfill for Neon
    // Only needed in Edge runtimes like Cloudflare Workers
    if (typeof WebSocket === 'undefined' && ws) {
      // @ts-ignore - This is only used in Edge runtime
      globalThis.WebSocket = ws.default || ws;
    }

    // Configure Neon for Edge
    if (ws) {
      neonConfig.webSocketConstructor = ws.default || ws;
      neonConfig.useSecureWebSocket = true;
      neonConfig.pipelineTLS = true;
      neonConfig.pipelineConnect = true;
    }

    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create connection pool and Neon adapter
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);

    // Create and initialize Prisma client
    cloudflareClient = new PrismaClient({ adapter });
    
    // Test connection
    await cloudflareClient.$connect();
    
    return cloudflareClient;
  } catch (error) {
    console.error('Failed to initialize Cloudflare database client:', error);
    throw new Error(`Failed to connect to database in Cloudflare environment: ${error}`);
  }
}

/**
 * A direct connector to Neon database
 * For direct SQL operations when needed
 */
export async function getNeonClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  try {
    // Dynamically import the Neon client
    const { createClient, neonConfig } = await import('@neondatabase/serverless');
    
    // Try to load ws for WebSocket polyfill
    let ws;
    try {
      ws = await import('ws');
    } catch (error) {
      // ws may not be available, fallback to native WebSocket
      console.log('ws module not available, using native WebSocket if available');
    }
    
    // Configure Neon for Edge
    if (typeof WebSocket === 'undefined' && ws) {
      // @ts-ignore - This is only used in Edge runtime
      globalThis.WebSocket = ws.default || ws;
    }
    
    if (ws) {
      neonConfig.webSocketConstructor = ws.default || ws;
      neonConfig.useSecureWebSocket = true;
      neonConfig.pipelineTLS = true;
      neonConfig.pipelineConnect = true;
    }
    
    // Create Neon client
    return createClient({
      connectionString: process.env.DATABASE_URL,
    });
  } catch (error) {
    console.error('Failed to create Neon client:', error);
    throw new Error(`Failed to connect to Neon database: ${error}`);
  }
}

export default {
  getCloudflareClient,
  getNeonClient,
}; 