/**
 * Edge runtime compatible authentication utilities
 * Use these utilities in Edge functions and Cloudflare Workers/Pages environments
 */

import * as jose from 'jose';

// Type for the JWT payload
export interface JWTPayload extends jose.JWTPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify a JWT token in Edge runtime
 */
export async function verifyJWTEdge(token: string): Promise<JWTPayload | null> {
  if (!token || token.length < 20) {
    console.log('EDGE: Invalid token (too short or empty)');
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!jwtSecret) {
    console.error('EDGE: JWT secret environment variable is not set');
    return null;
  }
  
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  try {
    const { payload } = await jose.jwtVerify(token, encodedSecret, {
      algorithms: ['HS256']
    });
    
    const decoded = payload as JWTPayload;

    if (!decoded.id || !decoded.email) {
      console.log('EDGE: Token missing required fields');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('EDGE: Token verification error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Generate a JWT token in Edge runtime
 */
export async function generateJWTEdge(payload: { id: string; email: string; role: string }): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret environment variable is not set');
  }
  
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
    
  return jwt;
}

/**
 * Extract token from request in Edge runtime
 */
export function getTokenFromRequestEdge(request: Request): string | null {
  // Try authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Parse cookies manually for standard Request
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    
    // Check for token cookie
    const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.substring(6); // Remove 'token=' prefix
    }
    
    // Check for next-auth.session-token cookie (NextAuth.js)
    const nextAuthCookie = cookies.find(cookie => cookie.startsWith('next-auth.session-token='));
    if (nextAuthCookie) {
      return nextAuthCookie.substring('next-auth.session-token='.length);
    }
  }
  
  return null;
} 