/**
 * Edge-compatible Auth API endpoint
 * Handles authentication operations in the Edge runtime
 * 
 * Supports:
 * - POST: Login with email/password
 * - GET: Validate session token
 */

import { NextRequest } from 'next/server';
import { getNeonPrismaClient } from '@/lib/prisma-cloudflare';
import { 
  comparePasswordEdge, 
  generateJwtToken, 
  getTokenFromRequestEdge, 
  verifyJWTEdge,
  setAuthCookie 
} from '@/lib/auth-utils-edge';

// Define the Edge runtime
export const runtime = 'edge';

// Use dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST handler for login
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    const { email, password } = data;
    
    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get database client optimized for Cloudflare
    const prisma = await getNeonPrismaClient();
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true
      }
    });
    
    // Check if user exists
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify password using Edge-compatible password comparison
    const isPasswordValid = await comparePasswordEdge(password, user.password);
    
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Generate JWT token
    const token = await generateJwtToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    });
    
    // Create response
    const response = new Response(
      JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // Set auth cookie with JWT token
    setAuthCookie(token);
    
    return response;
  } catch (error) {
    console.error('Error in edge auth API:', error);
    
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

/**
 * GET handler to validate token
 */
export async function GET(request: NextRequest) {
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
    
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return user information
    return new Response(
      JSON.stringify({ 
        session: payload,
        sessionExpires: payload.exp ? new Date(Number(payload.exp) * 1000).toISOString() : null
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in auth validation endpoint:', error);
    
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