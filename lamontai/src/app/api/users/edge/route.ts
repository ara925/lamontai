/**
 * Edge-compatible Users API endpoint
 * This API route is specifically designed to run in the Edge runtime
 */

import { NextRequest } from 'next/server';
import { getPrismaForEnvironment } from '@/lib/prisma-cloudflare';
import { verifyJWTEdge, getTokenFromRequestEdge } from '@/lib/auth-utils-edge';

// Specify Edge runtime
export const runtime = 'edge';

// Use dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Limit query complexity for Edge runtime
const MAX_USERS = 20;

/**
 * GET handler for retrieving users
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const token = getTokenFromRequestEdge(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the token
    const payload = await verifyJWTEdge(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get database client optimized for Cloudflare
    const prisma = getPrismaForEnvironment();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      MAX_USERS
    );
    
    // Query users with limited fields for Edge performance
    const users = await prisma.user.findMany({
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Return the users
    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in edge users API:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 