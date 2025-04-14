/**
 * Edge-compatible authentication utilities
 * Uses Web Crypto API instead of Node.js crypto
 */

import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Create a TextEncoder for string to Uint8Array conversion
const encoder = new TextEncoder();

// Get the JWT secret from environment variables
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET is not defined');
  }
  
  return encoder.encode(secret);
};

/**
 * Generate a JWT token using Web Crypto API
 */
export async function generateJwtToken(payload: any) {
  try {
    const secret = await getJwtSecret();
    
    // Create and sign the JWT
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days expiry
      .sign(secret);
    
    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
    return null;
  }
}

/**
 * Verify a JWT token using Web Crypto API
 */
export async function verifyJwtToken(token: string) {
  try {
    const secret = await getJwtSecret();
    
    // Verify the JWT
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

/**
 * Set a JWT token as an HTTP-only cookie
 */
export function setAuthCookie(token: string | null) {
  if (!token) return; // Skip if token is null
  
  cookies().set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
  });
}

/**
 * Get a token from cookies or request headers
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // First, try to get token from cookie
  const cookie = request.cookies.get('auth_token');
  if (cookie) {
    return cookie.value;
  }
  
  // Then, try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7); // Remove 'Bearer ' prefix
  }
  
  return null;
}

/**
 * Get a token from cookies in middleware or edge functions
 */
export function getTokenFromRequestEdge(request: NextRequest): string | null {
  return getTokenFromRequest(request);
}

/**
 * Verify JWT in edge functions
 */
export async function verifyJWTEdge(token: string) {
  return verifyJwtToken(token);
}

/**
 * Hash a password using Web Crypto API
 * Note: This is a simple implementation and not as secure as bcrypt.
 * In production, consider using a service like Auth0 or a custom API endpoint.
 */
export async function hashPasswordEdge(password: string): Promise<string> {
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare a password with a hash using Web Crypto API
 */
export async function comparePasswordEdge(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPasswordEdge(password);
  return passwordHash === hash;
} 