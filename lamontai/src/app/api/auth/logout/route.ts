import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/session-manager';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  console.log('API: Logout endpoint called');
  
  try {
    // Get the token from the request
    const token = getTokenFromRequest(request);
    
    if (token) {
      try {
        // Verify the token to get the user ID
        const payload = await verifyToken(token);
        
        if (payload && payload.id) {
          // Log the logout action
          console.log(`API: User ${payload.email} (${payload.id}) logged out`);
          
          // In a full implementation with the Session model, we would
          // delete the session from the database here
          // await db.session.deleteMany({ where: { token } });
        }
      } catch (error) {
        // If token verification fails, just continue with the logout
        console.error('API: Error verifying token during logout:', error);
      }
    }
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0), // Expire immediately
      path: '/',
    });
    
    console.log('API: Token cookie cleared');
    
    return response;
    
  } catch (error) {
    console.error('API: Logout error:', error);
    
    // Even if there's an error, we should still try to clear the cookie
    const response = NextResponse.json({ 
      success: false, 
      message: 'Error during logout',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    return response;
  }
} 