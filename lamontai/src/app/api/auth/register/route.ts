import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/server-auth-utils';
import { createSession } from '@/lib/session-manager';

// Registration validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"]
});

// Rate limiting for registrations (per IP)
const IP_RATE_LIMIT = 5; // Maximum 5 registrations per IP
const IP_RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Temporary storage for IP tracking (replace with Redis in production)
const ipRegistrationTracker: Record<string, { count: number, firstAttempt: number }> = {};

export async function POST(request: NextRequest) {
  console.log('=================== API REGISTER ROUTE HIT ===================');
  
  try {
    const body = await request.json();
    console.log('API Register: Received request body:', body);
    
    // Validate request
    const validation = registerSchema.safeParse(body);
    
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
    
    const { name, email, password, confirmPassword } = validation.data;
    console.log(`API: Registration attempt for ${email}, passwords match: ${password === confirmPassword}`);
    
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
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`API: User already exists: ${email}`);
      return NextResponse.json(
        { 
          success: false,
          message: 'User with this email already exists'
        }, 
        { status: 409 }
      );
    }
    
    // Check IP rate limiting
    const ip = request.ip || '127.0.0.1';
    const now = Date.now();
    const ipTracking = ipRegistrationTracker[ip];
    
    if (ipTracking) {
      // Reset tracking if outside window
      if (now - ipTracking.firstAttempt > IP_RATE_WINDOW) {
        ipRegistrationTracker[ip] = { count: 1, firstAttempt: now };
      } 
      // Increment count if within window
      else if (ipTracking.count >= IP_RATE_LIMIT) {
        console.log(`API: IP ${ip} exceeded registration rate limit`);
        return NextResponse.json(
          { 
            success: false,
            message: 'Too many registration attempts from this IP address. Please try again later.'
          }, 
          { status: 429 }
        );
      } else {
        ipRegistrationTracker[ip].count += 1;
      }
    } else {
      // First attempt from this IP
      ipRegistrationTracker[ip] = { count: 1, firstAttempt: now };
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user with transaction
    console.log('API Register: Starting database transaction...');
    let newUser: any;
    
    try {
      await db.$transaction(async (tx) => {
        console.log('API Register: [TX] Creating user...');
        newUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword
          },
        });
        
        console.log(`API Register: User created successfully`);
      });
    } catch (txError) {
      console.error('API Register: Transaction error:', txError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Transaction failed',
          error: 'Could not complete the transaction'
        }, 
        { status: 500 }
      );
    }
    
    // Create session
    let token;
    try {
      token = await createSession({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name || '',
        role: newUser.role
      }, request);
      console.log(`API: Registration successful for ${email}, session created`);
    } catch (sessionError) {
      console.error('API: Error creating session:', sessionError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error creating session', 
          error: 'Your account was created but we could not create a session.'
        }, 
        { status: 500 }
      );
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Create the response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          user: userWithoutPassword,
          token
        }
      },
      { status: 201 }
    );
    
    // Set the cookie with the token
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true, // Set to true for security
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    console.log(`API: Cookie set for ${email} - httpOnly: true`);
    
    return response;
  } catch (error) {
    console.error('API Register: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}