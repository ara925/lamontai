import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it accesses request properties
export const dynamic = 'force-dynamic';

// Import the edge-compatible adapter and PrismaClient
import { PrismaClient } from '@prisma/client';
import { createNeonAdapter } from '@/lib/driver-adapters/prisma-neon';

// We might need an edge-compatible Redis client or skip the check in edge
// import { getRedisClient } from '@/lib/redis-client'; 
import getRedisClient from '@/lib/redis-client-edge';

import logger from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

// Configure this route for edge compatibility
export const runtime = 'edge';

// Helper function to get edge Prisma client
async function getEdgePrismaClient() {
  const adapter = createNeonAdapter();
  return new PrismaClient({ adapter });
}

/**
 * GET /api/health
 * Health check endpoint to verify service status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let prisma: PrismaClient | null = null; // Initialize prisma variable

  try {
    // Basic app info
    const appInfo = {
      name: 'LamontAI API',
      version: process.env.APP_VERSION || '1.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
      uptime: typeof process !== 'undefined' && process.uptime ? 
        process.uptime().toFixed(2) + 's' : 'unknown',
    };
    
    // Check database connection using edge client
    let dbStatus = 'disconnected';
    try {
      prisma = await getEdgePrismaClient();
      // Use a simple query that works with adapters
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (dbError) {
      logger.error('Health check - Database connection failed:', dbError);
      dbStatus = 'error';
    } finally {
      // Ensure disconnect even if error occurred during query
      if (prisma) {
        await prisma.$disconnect().catch(console.error);
      }
    }
    
    // Check Redis connection (using edge-compatible client instance)
    let redisStatus = 'disconnected';
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        // Use the imported edge client instance directly
        const redisClient = getRedisClient; // Renamed import to redisClientInstance for clarity below if needed
        
        // Set a test value
        const testKey = 'health:test:' + Date.now();
        await redisClient.set(testKey, { status: 'ok' }, 30); // 30 second TTL
        
        // Get the test value to verify
        const value = await redisClient.get(testKey);
        if (value && (value as any).status === 'ok') {
          redisStatus = 'connected';
        }
        
        // Clean up
        await redisClient.del(testKey);
      } catch (redisError) {
        logger.error('Health check - Redis connection failed:', redisError);
        redisStatus = 'error';
      }
    } else {
      // Redis is disabled, using in-memory fallback
      redisStatus = 'disabled (using in-memory fallback)';
    }
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Determine overall status
    let overallStatus = 'healthy';
    if (dbStatus === 'error') {
      overallStatus = 'degraded';
    }
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: responseTime + 'ms',
      services: {
        api: {
          status: 'online',
          info: appInfo
        },
        database: {
          status: dbStatus,
          type: 'postgresql'
        },
        cache: {
          status: redisStatus,
          type: process.env.REDIS_ENABLED === 'true' ? 'redis' : 'in-memory'
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    // Disconnect prisma if it was initialized before the error
    if (prisma) {
      await prisma.$disconnect().catch(console.error);
    }
    return handleApiError(error, request);
  }
} 