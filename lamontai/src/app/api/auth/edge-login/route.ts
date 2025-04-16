/**
 * Edge-compatible login API endpoint
 * This API route handles user authentication in the Edge runtime
 */

import { NextRequest } from 'next/server';
import { getPrismaForEnvironment } from '@/lib/prisma-cloudflare';
import { comparePasswordEdge, generateJwtToken, setAuthCookie } from '@/lib/auth-utils-edge';

// Specify Edge runtime
export const runtime = 'edge';

// Use dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST handler for user login
 */
export async function POST(request: NextRequest) {
  // Get the correct Prisma client for the environment (edge in this case)
  const prisma = getPrismaForEnvironment();
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
        JSON.stringify({ error: 'Invalid email or password' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify password using Edge-compatible password comparison
    const isValidPassword = await comparePasswordEdge(password, user.password);
    
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
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
    console.error('Error in edge login API:', error);
    // Disconnect is not typically needed/available for Accelerate client
    // if (prisma && typeof prisma.$disconnect === 'function') { 
    //   await prisma.$disconnect().catch(console.error);
    // }
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