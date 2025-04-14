import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import redisClient from '@/lib/redis-client';
import logger from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

/**
 * GET /api/health
 * Health check endpoint to verify service status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic app info
    const appInfo = {
      name: 'LamontAI API',
      version: process.env.APP_VERSION || '1.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
      uptime: process.uptime().toFixed(2) + 's',
    };
    
    // Check database connection
    let dbStatus = 'disconnected';
    try {
      await db.$connect();
      
      // Run a simple query
      await db.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (dbError) {
      logger.error('Health check - Database connection failed:', dbError);
      dbStatus = 'error';
    } finally {
      try {
        await db.$disconnect();
      } catch (error) {
        logger.error('Health check - Error disconnecting from database:', error);
      }
    }
    
    // Check Redis connection
    let redisStatus = 'disconnected';
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        // Set a test value
        const testKey = 'health:test:' + Date.now();
        await redisClient.set(testKey, { status: 'ok' }, 30); // 30 second TTL
        
        // Get the test value to verify
        const value = await redisClient.get(testKey);
        if (value && (value as any).status === 'ok') {
          redisStatus = 'connected';
        }
        
        // Clean up
        await redisClient.delete(testKey);
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
    return handleApiError(error, request);
  }
} 