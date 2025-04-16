import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// Removed: import { db } from '@/lib/db';
// Logout likely doesn't need db access unless invalidating sessions server-side
import { invalidateSession } from '@/lib/session-manager'; // Assuming this handles session invalidation
import { getUserIdFromRequest } from '@/lib/server-auth-utils'; // To get user/session info

// Ensure edge runtime is explicitly configured
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // Ensures dynamic execution

export async function POST(request: NextRequest) {
  try {
    const token = cookies().get("token")?.value;

    if (token) {
      // Optionally invalidate the session server-side if needed
      // This requires session-manager to be edge-compatible
      // await invalidateSession(token); 
    }

    // Clear the cookie on the client-side regardless
    const response = NextResponse.json({ success: true, message: "Logged out" });
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, message: 'Logout failed' }, { status: 500 });
  }
} 