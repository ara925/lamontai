import { NextRequest, NextResponse } from 'next/server';

// Specify the runtime
export const runtime = 'nodejs';

// Mark this route as dynamic since it accesses request properties
export const dynamic = 'force-dynamic';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { users, MockUser } from '@/lib/mock-data';

// Define validation schema
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export async function POST(req: NextRequest) {
  try {
    console.log("[API] Register endpoint called");
    
    // Parse request body
    const body = await req.json();
    console.log("[API] Register body:", JSON.stringify(body));
    
    // Validate input
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      console.log("[API] Register validation failed:", result.error.flatten());
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { name, email, password } = result.data;
    
    // Check if user already exists
    const userExists = users.some(user => user.email === email);
    
    if (userExists) {
      console.log("[API] Register user already exists:", email);
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Hash password (in a real app, we'd want a higher salt round)
    const hashedPassword = await hash(password, 10);
    
    // Create user (in mock data)
    const newUser: MockUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    
    // Add to mock users array
    users.push(newUser);
    console.log("[API] Register user created:", email);
    
    // Return success without exposing sensitive data
    return NextResponse.json(
      { 
        success: true, 
        message: "User registered successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("[API] Registration error:", error);
    
    // Ensure we always return a proper JSON response
    return NextResponse.json(
      { success: false, message: "Server error during registration" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}