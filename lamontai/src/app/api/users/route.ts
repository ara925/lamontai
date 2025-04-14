/**
 * Node.js compatible Users API endpoint
 * This API route is designed to run in the Node.js runtime
 * and can use the full Node.js API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { compare, hash } from 'bcryptjs';

// Specify Node.js runtime explicitly
export const runtime = 'nodejs';

// Use dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Create a Prisma client for Node.js
const prisma = new PrismaClient();

/**
 * GET handler for retrieving users with full capabilities
 */
export async function GET(request: NextRequest) {
  try {
    // Get server session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user has admin privileges
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Simple query implementation without complex filters
    let whereClause = {};
    
    if (search) {
      // Simple search by email only to avoid type issues
      whereClause = {
        email: {
          contains: search
        }
      };
    }
    
    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Include related settings with fields from the schema
          settings: {
            select: {
              id: true,
              theme: true,
              language: true,
              websiteUrl: true,
              businessDescription: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    
    // Return response with pagination metadata
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error in Node.js users API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new user
 * Using Node.js-specific functionality (bcryptjs)
 */
export async function POST(request: NextRequest) {
  try {
    // Get server session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user has admin privileges
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const { name, email, password, role } = data;
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password using bcryptjs (Node.js specific)
    const hashedPassword = await hash(password, 10);
    
    // Create user without settings to avoid type issues
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    // Create settings separately with fields from the schema
    await prisma.settings.create({
      data: {
        userId: newUser.id,
        theme: 'light',
        language: 'english',
        notifications: true
      }
    });
    
    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 