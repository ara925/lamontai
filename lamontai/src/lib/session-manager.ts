/**
 * Session management utilities for server-side token handling
 * Only import this in Server Components or API routes
 */

import { getDatabaseClient } from "./db";
import { generateToken, verifyToken, verifyJWT } from "./server-auth-utils";
import { NextRequest } from "next/server";
import * as jose from 'jose';
import { users, MockUser } from './mock-data';
import type { Session } from 'next-auth';
import prisma from './prisma';

// Session duration in days
const SESSION_DURATION_DAYS = 7;

// Interface for session user
export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string | null> {
  try {
    // Generate a random token
    const sessionToken = crypto.randomUUID();
    
    // Create a session in the database
    await prisma.session.create({
      data: {
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    return sessionToken;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
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
  if (!token) {
    return null;
  }

  try {
    // First find the session
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (!session?.user) {
      return null;
    }

    // Return the user data
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role || 'user',
    };
  } catch (error) {
    console.error('Error getting user by session token:', error);
    return null;
  }
}

/**
 * Extract token from request
 */
export function getTokenFromRequest(request: Request | NextRequest): string | null {
  try {
    // Try authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Then try cookies
    if ('cookies' in request) {
      const token = (request as NextRequest).cookies.get('token')?.value;
      if (token) return token;
    } else {
      // Parse cookies manually from standard Request
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader && typeof cookieHeader === 'string') {
        try {
          // Use safer approach with indexOf and substring instead of split
          const tokenPrefix = 'token=';
          const tokenStartIndex = cookieHeader.indexOf(tokenPrefix);
          
          if (tokenStartIndex >= 0) {
            // Start after the prefix
            const startPos = tokenStartIndex + tokenPrefix.length;
            // Find end position (either semicolon or end of string)
            const endPos = cookieHeader.indexOf(';', startPos);
            const tokenValue = endPos > 0 
              ? cookieHeader.substring(startPos, endPos) 
              : cookieHeader.substring(startPos);
              
            if (tokenValue) return tokenValue;
          }
        } catch (e) {
          console.error('Error parsing cookies manually:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting token from request:', error);
  }
  
  return null;
}

/**
 * Get user data from a Next.js session object
 */
export async function getUserBySession(session: Session | null): Promise<SessionUser | null> {
  if (!session || !session.user?.email) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting user by session:', error);
    return null;
  }
}

/**
 * Invalidates a session by token
 */
export async function invalidateSession(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { sessionToken: token },
    });
    return true;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
} 