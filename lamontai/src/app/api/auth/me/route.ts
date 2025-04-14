/**
 * API route to check current user authentication
 * Works in both Node.js and Edge/Cloudflare environments
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getTokenFromRequestEdge, verifyJWTEdge } from '@/lib/auth-utils-edge';
import { users } from '@/lib/mock-data';

// Ensure this route is always dynamically rendered
export const dynamic = 'force-dynamic';
// Specify that this can run in edge runtime
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // First try to get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      // User is authenticated via NextAuth
      return NextResponse.json({
        success: true,
        message: 'Authenticated with NextAuth',
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role || 'user',
          provider: 'nextauth'
        }
      });
    }
    
    // If no NextAuth session, try JWT token
    const token = getTokenFromRequestEdge(request);
    
    if (token) {
      const payload = await verifyJWTEdge(token);
      
      if (payload) {
        // For development/testing with mock data
        if (process.env.NODE_ENV === 'development') {
          const mockUser = users.find(user => user.id === payload.id);
          if (mockUser) {
            return NextResponse.json({
              success: true,
              message: 'Authenticated with JWT token',
              user: {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
                provider: 'jwt'
              }
            });
          }
        }
        
        // If a valid token but no matching user in dev mode, or in production
        return NextResponse.json({
          success: true,
          message: 'Valid token, but no matching user',
          user: {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            provider: 'jwt'
          }
        });
      }
    }
    
    // No valid authentication found
    return NextResponse.json({
      success: false,
      message: 'Not authenticated'
    }, { status: 401 });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    
    // Return a generic error to avoid leaking implementation details
    return NextResponse.json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error))
        : 'Server error'
    }, { status: 500 });
  }
} 