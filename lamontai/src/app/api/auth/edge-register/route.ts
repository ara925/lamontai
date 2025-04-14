/**
 * Edge-compatible registration API endpoint
 * This API route handles user registration in the Edge runtime
 */

import { NextRequest } from 'next/server';
import { getNeonPrismaClient } from '@/lib/prisma-cloudflare';
import { hashPasswordEdge, generateJwtToken, setAuthCookie } from '@/lib/auth-utils-edge';

// Specify Edge runtime
export const runtime = 'edge';

// Use dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST handler for user registration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    const { name, email, password } = data;
    
    // Validate input
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get database client optimized for Cloudflare
    const prisma = await getNeonPrismaClient();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Hash password using Edge-compatible password hashing
    const hashedPassword = await hashPasswordEdge(password);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    // Create settings
    await prisma.settings.create({
      data: {
        userId: newUser.id
        // Let schema defaults handle the rest
      }
    });
    
    // Generate JWT token
    const token = await generateJwtToken({
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    });
    
    // Create response
    const response = new Response(
      JSON.stringify({
        message: 'User registered successfully',
        user: newUser,
        token
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // Set auth cookie with JWT token
    setAuthCookie(token);
    
    return response;
  } catch (error) {
    console.error('Error in edge registration API:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 