import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/server-auth-utils';
import { createSession } from '@/lib/session-manager';

// Login request validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request data',
          error: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        }, 
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    console.log(`API: Login attempt for ${email}`);
    
    // Check database connection
    try {
      await db.$connect();
      console.log('API: Database connection successful');
    } catch (dbError) {
      console.error('API: Database connection error:', dbError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Database connection failed',
          error: 'Could not connect to the database'
        }, 
        { status: 500 }
      );
    }
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`API: Login failed - user not found: ${email}`);
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid email or password'
        }, 
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`API: Login failed - invalid password for: ${email}`);
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid email or password'
        }, 
        { status: 401 }
      );
    }
    
    // Update last login time
    await db.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });
    
    console.log(`API: Login successful for ${email}`);
    
    // Create a new server-side session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role
    }, request);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Create the response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      }, 
      { status: 200 }
    );
    
    // Set the cookie with the token - non-httpOnly so it can be accessed by client JavaScript
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true, // Changed to true for security
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    console.log(`API: Cookie set for ${email} - httpOnly: true`);
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred during login',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    // Close the database connection
    try {
      await db.$disconnect();
      console.log('API: Database connection closed');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 