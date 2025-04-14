import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for validation
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    
    // Check if a user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase()
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    
    // Get IP address
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              '127.0.0.1';
    
    // Check for multiple registrations from same IP
    const ipRegistrations = await prisma.user.count({
      where: { email: email.toLowerCase() }
    });
    
    // Limit registrations per IP (adjust the limit as needed)
    if (ipRegistrations >= 3) {
      return NextResponse.json(
        { error: "Maximum registration limit reached" },
        { status: 429 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "user"
      }
    });
    
    // Return success without password
    return NextResponse.json(
      { 
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role
        }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
} 