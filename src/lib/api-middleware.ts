import { createMiddlewareDecorator } from 'next-api-middleware';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './db'; // Import directly from the corrected file
import logger from './logger';

// Create our own compression middleware instead of importing
// since compress is not exported from next-api-middleware
import compression from 'compression';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT = {
  DEFAULT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  AUTH: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  CONTENT_GEN: {
    MAX_REQUESTS: 5,
    WINDOW_MS: 60 * 1000, // 1 minute
  }
};

// In-memory store for rate limiting
const rateLimitStore = new Map();

/**
 * Rate limiting middleware
 */
export const rateLimit = createMiddlewareDecorator(async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const path = req.url || '/';
  const key = `rate-limit:${ip}:${path}`;
  const now = Date.now();
  
  // Determine rate limit configuration based on path
  let config = RATE_LIMIT.DEFAULT;
  if (path.includes('/api/auth')) {
    config = RATE_LIMIT.AUTH;
  } else if (path.includes('/api/generate') || path.includes('/api/content')) {
    config = RATE_LIMIT.CONTENT_GEN;
  }
  
  // Get or create rate limit record
  let record = rateLimitStore.get(key);
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.WINDOW_MS,
    };
    rateLimitStore.set(key, record);
    
    // Set up cleanup
    setTimeout(() => {
      rateLimitStore.delete(key);
    }, config.WINDOW_MS);
  }
  
  // Increment counter
  record.count += 1;
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', config.MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', record.resetTime);
  
  // Check if rate limit exceeded
  if (record.count > config.MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded: ${ip}, ${path}`);
    return res.status(429).json({
      error: 'Too many requests, please try again later.',
      retry_after: Math.ceil((record.resetTime - now) / 1000),
    });
  }
  
  await next();
});

/**
 * Authentication middleware
 */
export const authenticate = createMiddlewareDecorator(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    
    await next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * Admin-only middleware
 */
export const requireAdmin = createMiddlewareDecorator(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  await next();
});

/**
 * Compression middleware
 */
export const compress = createMiddlewareDecorator(async (req, res, next) => {
  const compressionMiddleware = compression();
  
  compressionMiddleware(req, res, () => {
    next();
  });
});

/**
 * Logger middleware
 */
export const logRequest = createMiddlewareDecorator(async (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  logger.info(`${req.method} ${req.url}`);
  
  // Process the request
  await next();
  
  // Log response time
  const duration = Date.now() - start;
  logger.info(`${req.method} ${req.url} [${res.statusCode}] - ${duration}ms`);
}); 