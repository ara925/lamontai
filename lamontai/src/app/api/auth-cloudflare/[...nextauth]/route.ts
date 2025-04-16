import { NextRequest, NextResponse } from 'next/server';
import { generateTokenEdge, verifyPasswordEdge } from '@/lib/auth-helpers-edge';

// Configure as edge runtime for Cloudflare
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

/**
 * Custom auth handler for Cloudflare edge environments
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body and extract credentials
    const requestData = await request.json();
    const { email, password } = requestData?.credentials || {};
    
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid credentials format' },
        { status: 400 }
      );
    }
    
    try {
      // Import DB (dynamic import for edge compatibility)
      const { getDatabaseClient } = await import('@/lib/db');
      const db = await getDatabaseClient();
      
      // Find user by email
      const user = await db.user.findUnique({
        where: { email }
      });
      
      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'User not found or password not set' },
          { status: 401 }
        );
      }
      
      // Verify password using edge-compatible method
      const isValid = await verifyPasswordEdge(password, user.password);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      // Generate a JWT token with user data
      const token = await generateTokenEdge({
        id: user.id,
        email: user.email,
        role: user.role || 'user'
      });
      
      // Return response with token
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          role: user.role || 'user'
        },
        token
      });
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { error: 'Authentication failed', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

/**
 * GET handler for session validation
 */
export async function GET(request: NextRequest) {
  // Return a default response for GET requests in edge environments
  return NextResponse.json(
    { message: 'Please use POST for authentication' },
    { status: 405 }
  );
} 