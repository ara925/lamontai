import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Ensure this route is always rendered dynamically
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Return session data or a message if no session exists
    return NextResponse.json({
      status: 'success',
      authenticated: !!session,
      session: session,
      env: {
        // Only return public environment variables
        nextauthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Session error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Failed to get session',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 