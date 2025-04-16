import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from './db';

/**
 * Custom middleware for API routes
 */
export function withAuth(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Use safer substring method instead of split
      const token = authHeader.substring(7); // 'Bearer '.length === 7
      
      // Verify token using jose
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('JWT_SECRET environment variable is not set');
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }
        
        const encodedSecret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jose.jwtVerify(token, encodedSecret, {
          algorithms: ['HS256']
        });
        
        // Check required claims
        if (!payload.id || typeof payload.id !== 'string') {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        // Call the original handler with userId
        return handler(req, payload.id as string);
      } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    } catch (error) {
      console.error('API middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * Middleware to check user permissions
 */
export function withRole(handler: (req: NextRequest, userId: string) => Promise<NextResponse>, role: string) {
  return async (req: NextRequest) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Use safer substring method instead of split
      const token = authHeader.substring(7); // 'Bearer '.length === 7
      
      // Verify token using jose
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('JWT_SECRET environment variable is not set');
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }
        
        const encodedSecret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jose.jwtVerify(token, encodedSecret, {
          algorithms: ['HS256']
        });
        
        // Check required claims
        if (!payload.id || !payload.role || typeof payload.id !== 'string') {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        // Check role
        if (payload.role !== role) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        
        // Call the original handler with userId
        return handler(req, payload.id as string);
      } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    } catch (error) {
      console.error('API middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
} 