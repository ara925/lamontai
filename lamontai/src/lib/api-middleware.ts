import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import compression from 'compression';
import { prisma } from './db';
import logger from './logger';

/**
 * API middleware for adding security headers, compression, and timeout handling
 */

/**
 * Add security headers to API responses
 */
export function withSecurityHeaders(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const response = await handler(req, ...args);
    
    // Only add security headers to API responses
    if (response && response instanceof NextResponse) {
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
    
    return response;
  };
}

/**
 * Add response compression for API responses
 */
export function withCompression(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      // For Next.js App Router, compression is handled at the infrastructure level
      // This is a placeholder to maintain the middleware chain
      return await handler(req, ...args);
    } catch (error) {
      console.error('API compression middleware error:', error);
      
      // Ensure we return JSON errors, not HTML
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'An error occurred processing the request',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  };
}

/**
 * Add request timeout handling
 * @param timeoutMs Maximum time in milliseconds before timing out the request
 */
export function withTimeout(timeoutMs = 30000) {
  return (handler: any) => {
    return async (req: NextRequest, ...args: any[]) => {
      return Promise.race([
        handler(req, ...args),
        new Promise<NextResponse>((_, reject) => 
          setTimeout(() => {
            reject(
              new NextResponse(
                JSON.stringify({ 
                  success: false,
                  error: 'Request timeout',
                  message: 'The server took too long to respond'
                }),
                { status: 504, headers: { 'Content-Type': 'application/json' } }
              )
            );
          }, timeoutMs)
        )
      ]).catch(error => {
        if (error instanceof NextResponse) {
          return error;
        }
        
        console.error('API request error:', error);
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      });
    };
  };
}

/**
 * Add CORS headers to API responses
 */
export function withCors(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    // Check if preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    // Handle the request normally
    const response = await handler(req, ...args);
    
    // Add CORS headers to the response
    if (response && response instanceof NextResponse) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    return response;
  };
}

/**
 * Monitor and log API performance metrics
 */
export function withPerformanceMetrics(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const url = req.url;
    const method = req.method;
    
    try {
      // Process the request
      const response = await handler(req, ...args);
      
      // Calculate performance metrics
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Add performance headers
      if (response && response instanceof NextResponse) {
        response.headers.set('X-Response-Time', `${duration}ms`);
      }
      
      // Log the metrics
      console.log(`[API] ${method} ${url} completed in ${duration}ms`);
      
      return response;
    } catch (error) {
      // Log error with performance info
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`[API] ${method} ${url} failed after ${duration}ms:`, error);
      
      throw error;
    }
  };
}

/**
 * Combined middleware for API routes
 */
export function withApiMiddleware(handler: any) {
  return withSecurityHeaders(
    withCompression(
      withCors(
        withTimeout(30000)(
          withPerformanceMetrics(handler)
        )
      )
    )
  );
} 