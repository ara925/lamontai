import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/server-auth-utils';
import { Errors, handleApiError } from './lib/error-handler';
import { Redis } from 'ioredis';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT = {
  DEFAULT: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  AUTH: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute for auth endpoints
  GENERATE: { limit: 5, windowMs: 60 * 1000 }, // 5 requests per minute for content generation
};

/**
 * Redis client for rate limiting (or in-memory fallback)
 */
let redis: Redis | null = null;
const inMemoryRateLimits: Record<string, { count: number, resetAt: number }> = {};

/**
 * Initialize Redis client
 */
function getRedisClient() {
  // Only create the client once
  if (!redis && process.env.REDIS_ENABLED === 'true') {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10),
      });
      
      console.log('Middleware Redis client initialized');
      
      redis.on('error', (err) => {
        console.error('Middleware Redis error:', err);
        redis = null; // Reset on error
      });
    } catch (err) {
      console.error('Failed to initialize middleware Redis client:', err);
      redis = null;
    }
  }
  
  return redis;
}

/**
 * Rate limit implementation
 */
async function rateLimit(
  request: NextRequest,
  key: string,
  { limit, windowMs }: { limit: number, windowMs: number }
): Promise<{ limited: boolean, remaining: number, resetAt: number }> {
  const client = getRedisClient();
  const now = Date.now();
  const resetAt = now + windowMs;
  
  // Use Redis if available
  if (client) {
    try {
      const requestsKey = `ratelimit:${key}`;
      const currentCount = await client.incr(requestsKey);
      
      // Set expiration on first request
      if (currentCount === 1) {
        await client.pexpire(requestsKey, windowMs);
      }
      
      const ttl = await client.pttl(requestsKey);
      const remaining = Math.max(0, limit - currentCount);
      
      return {
        limited: currentCount > limit,
        remaining,
        resetAt: now + ttl,
      };
    } catch (err) {
      console.error('Rate limiting Redis error:', err);
      // Fall back to in-memory rate limiting on Redis error
    }
  }
  
  // In-memory fallback
  if (!inMemoryRateLimits[key] || inMemoryRateLimits[key].resetAt < now) {
    inMemoryRateLimits[key] = { count: 1, resetAt };
  } else {
    inMemoryRateLimits[key].count += 1;
  }
  
  const current = inMemoryRateLimits[key];
  const remaining = Math.max(0, limit - current.count);
  
  return {
    limited: current.count > limit,
    remaining,
    resetAt: current.resetAt,
  };
}

/**
 * Get the rate limit configuration for a specific path
 */
function getRateLimitConfig(path: string) {
  if (path.includes('/api/auth/')) {
    return RATE_LIMIT.AUTH;
  } else if (path.includes('/api/generate/')) {
    return RATE_LIMIT.GENERATE;
  }
  
  return RATE_LIMIT.DEFAULT;
}

/**
 * Apply security headers to response
 */
function addSecurityHeaders(response: NextResponse) {
  // Set security headers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Don't set strict CSP in development
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.openai.com;"
    );
  }
  
  return response;
}

// Temporarily disable middleware for debugging
export async function middleware(request: NextRequest) {
  // Simply pass through all requests during debugging
  return NextResponse.next();
}

/**
 * Configure which paths should trigger this middleware
 */
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*', 
    // Match all dashboard routes (requires authentication)
    '/dashboard/:path*',
    // Match all onboarding routes (requires authentication)
    '/onboarding/:path*',
  ],
}; 