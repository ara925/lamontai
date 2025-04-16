/**
 * Edge-compatible /api/auth/me route
 * Provides user information based on JWT token
 */

import { NextRequest } from 'next/server';
import { getTokenFromRequestEdge, verifyJWTEdge } from '@/lib/auth-utils-edge';
import { getPrismaForEnvironment } from '@/lib/prisma-cloudflare';

// Specify Edge runtime
export const runtime = 'edge';

// Use dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Get the correct Prisma client for the environment (edge in this case)
  const prisma = getPrismaForEnvironment();
  try {
    // Extract JWT token from request
    const token = getTokenFromRequestEdge(request);
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify token
    const payload = await verifyJWTEdge(token);
    
    if (!payload || !payload.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return user information
    return new Response(
      JSON.stringify({ 
        user,
        sessionExpires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in auth/me endpoint:', error);
    // Disconnect is not typically needed/available for Accelerate client
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 