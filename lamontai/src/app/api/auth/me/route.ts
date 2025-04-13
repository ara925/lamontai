import { NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { getTokenFromRequest, getUserBySessionToken } from "@/lib/session-manager";

export async function GET(request: Request) {
  console.log('API: /auth/me route called');
  
  try {
    // Get token from request
    const token = getTokenFromRequest(request);
    
    if (!token) {
      console.log('API: No token found in request');
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    // Get user from session token
    const user = await getUserBySessionToken(token);
    
    if (!user) {
      console.error('API: Invalid session or user not found');
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid session or session expired'
      }, { status: 401 });
    }
    
    console.log(`API: Session verified for user: ${user.email}`);
    
    // Return user data
    return NextResponse.json({ 
      success: true, 
      data: user
    });
    
  } catch (error) {
    console.error('API me route error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 