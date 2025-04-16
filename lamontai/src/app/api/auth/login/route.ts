import { NextRequest, NextResponse } from 'next/server';

// Specify the runtime
export const runtime = 'nodejs';

// Mark this route as dynamic since it accesses request properties
export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { users } from '@/lib/mock-data';

// Login request validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    // Log for debugging
    console.log('[API Login] Request received:', body);
    
    // Simple validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email (simple mock implementation)
    const user = users.find(u => u.email === body.email);
    
    // Simple password check for development
    const isValidPassword = 
      (body.password === 'password123' && body.email === 'user@example.com') ||
      (body.password === 'admin123' && body.email === 'admin@example.com');
    
    if (user && isValidPassword) {
      // Note: In a client-side component, you would use signIn() from next-auth/react
      // But this is a server route, so we're directly returning a success response
      // The frontend should redirect to the NextAuth callback endpoint
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          }
        },
        { 
          status: 200,
          headers: {
            'Set-Cookie': `token=dummy-session-${Date.now()}; Path=/; HttpOnly; SameSite=Lax`
          }
        }
      );
    }
    
    // Auth failed
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[API Login] Error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 