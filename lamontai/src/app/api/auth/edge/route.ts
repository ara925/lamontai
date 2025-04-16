/**
 * Edge-compatible Authentication API endpoint
 * This API route is specifically designed to run in the Edge runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { comparePasswordEdge, generateJwtToken } from '@/lib/auth-utils-edge';
import { createNeonAdapter } from '@/lib/driver-adapters/prisma-neon';

// Specify Edge runtime for Cloudflare compatibility
export const runtime = 'edge';

// Use dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

/**
 * Get Prisma client optimized for edge runtime
 */
async function getEdgePrismaClient() {
  const adapter = createNeonAdapter();
  return new PrismaClient({ adapter });
}

/**
 * Helper function to set authentication cookie
 */
function setAuthCookie(token: string | null, response: NextResponse) {
  // Prevent setting null tokens as cookies
  if (!token) return response;

  // Set cookie with appropriate security settings
  return response.cookies.set({
    name: 'auth-token',
    value: token, // Ensure this is never null
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

/**
 * POST handler for user authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body || {};

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get database client optimized for Cloudflare
    const prisma = await getEdgePrismaClient();

    try {
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
        await prisma.$disconnect().catch(console.error);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Verify password
      const passwordMatch = await comparePasswordEdge(password, user.password);
      if (!passwordMatch) {
        await prisma.$disconnect().catch(console.error);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate JWT
      const token = await generateJwtToken({
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });

      // Clean up user data for response
      const { password: _, ...userWithoutPassword } = user;

      // Clean up connection
      await prisma.$disconnect().catch(console.error);

      // Create response with token
      const response = NextResponse.json(
        {
          message: 'Login successful',
          user: userWithoutPassword,
          token
        },
        { status: 200 }
      );

      // Set the auth cookie
      setAuthCookie(token, response);

      // Return successful response with token
      return response;
    } catch (dbError) {
      // Handle database errors
      console.error('Database error during authentication:', dbError);
      await prisma.$disconnect().catch(console.error);
      
      return NextResponse.json(
        { 
          error: 'Authentication error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Logout handler for Edge Runtime
 */
export async function DELETE(request: NextRequest) {
  try {
    // Clear the auth cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Logged out successfully' 
      },
      { status: 200 }
    );
    
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0), // Expire immediately
      maxAge: 0,
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving current user based on token
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : request.cookies.get('auth_token')?.value;
      
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Not authenticated' 
        },
        { status: 401 }
      );
    }
    
    // Create Prisma client for edge environment
    const prisma = await getEdgePrismaClient();
      
    try {  
      // Find user by ID in the JWT payload
      const user = await prisma.user.findUnique({
        where: { id: "user-id" }, // Replace with actual user ID from token
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
        await prisma.$disconnect().catch(console.error);
        return NextResponse.json(
          { 
            error: 'User not found' 
          },
          { status: 404 }
        );
      }
        
      await prisma.$disconnect().catch(console.error);
      return NextResponse.json(
        { user },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      if (prisma) {
        await prisma.$disconnect().catch(console.error);
      }
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 