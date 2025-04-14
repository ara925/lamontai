/**
 * Session management utilities for server-side token handling
 * Only import this in Server Components or API routes
 */

import { db } from "./db";
import { generateToken, verifyToken, verifyJWT } from "./server-auth-utils";
import { NextRequest } from "next/server";
import * as jose from 'jose';
import { users, MockUser } from './mock-data';

// Session duration in days
const SESSION_DURATION_DAYS = 7;

// Interface for session user
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Create a new session for a user
 */
export async function createSession(user: SessionUser, request?: NextRequest): Promise<string> {
  // Generate a JWT token with additional session info
  const token = await generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  
  console.log(`Session created for user ${user.email}`);
  
  return token;
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<{userId: string} | null> {
  if (!token) return null;
  
  try {
    // Verify the JWT token
    const payload = await verifyJWT(token);
    if (!payload) {
      console.log('JWT token verification failed');
      return null;
    }
    
    return {
      userId: payload.id
    };
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Get a user by session token
 */
export async function getUserBySessionToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  
  try {
    const payload = await verifyJWT(token);
    if (!payload || !payload.id) return null;
    
    // For development/testing, use mock data
    if (process.env.NODE_ENV === 'development') {
      const mockUser = users.find(user => user.id === payload.id);
      if (mockUser) {
        return {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        };
      }
    }
    
    // For production, use database
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by token:', error);
    return null;
  }
}

/**
 * Extract token from request
 */
export function getTokenFromRequest(request: Request | NextRequest): string | null {
  // Try authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Then try cookies
  if ('cookies' in request) {
    const token = (request as NextRequest).cookies.get('token')?.value;
    if (token) return token;
  } else {
    // Parse cookies manually from standard Request
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      if (tokenCookie) {
        return tokenCookie.substring(6); // Remove 'token=' prefix
      }
    }
  }
  
  return null;
} 