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

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and non-API paths that don't need auth
  const isStaticAsset = pathname.startsWith('/_next') || 
                        pathname.startsWith('/images') || 
                        pathname.startsWith('/fonts') || 
                        pathname.startsWith('/favicon.ico');
  
  // Public API routes that don't require auth
  const isPublicApiRoute = pathname === '/api/auth/register' || 
                           pathname === '/api/auth/login' || 
                           pathname === '/api/health';

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // First apply rate limiting and security headers for API routes
  if (pathname.startsWith('/api/')) {
    try {
      // Get client IP for rate limiting
      const ip = request.ip || 'unknown';
      const path = pathname;
      
      // Create a unique key for rate limiting based on IP and path
      const rateLimitKey = `${ip}:${path}`;
      
      // Get rate limit configuration for this path
      const rateLimitConfig = getRateLimitConfig(path);
      
      // Apply rate limiting
      const { limited, remaining, resetAt } = await rateLimit(
        request,
        rateLimitKey,
        rateLimitConfig
      );
      
      // If rate limited, return 429 response
      if (limited) {
        const response = NextResponse.json(
          {
            success: false,
            error: {
              message: 'Rate limit exceeded. Please try again later.',
              status: 429,
              code: 'RATE_LIMIT_EXCEEDED',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('Retry-After', Math.ceil((resetAt - Date.now()) / 1000).toString());
        response.headers.set('X-RateLimit-Limit', rateLimitConfig.limit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
        
        return addSecurityHeaders(response);
      }
      
      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', rateLimitConfig.limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
      
      // For public API routes, we don't need to check auth
      if (isPublicApiRoute) {
        return addSecurityHeaders(response);
      }
      
      // For protected API routes, verify the token
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1] || '';
      
      // Also check for token in cookies for browser-based requests
      const cookies = request.cookies;
      const cookieToken = cookies.get('token')?.value;
      
      // Use either the Authorization header token or cookie token
      const finalToken = token || cookieToken;
      
      // If no token is provided, return unauthorized
      if (!finalToken) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Authentication required',
              status: 401,
              code: 'UNAUTHORIZED',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }
      
      // Verify token
      try {
        await verifyToken(finalToken);
        return addSecurityHeaders(response);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid or expired token',
              status: 401,
              code: 'UNAUTHORIZED',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // If something goes wrong, let the request through and let the API route handle it
      return NextResponse.next();
    }
  }
  
  // For non-API routes, just proceed
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