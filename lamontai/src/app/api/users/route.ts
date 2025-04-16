/**
 * Edge-compatible Users API endpoint
 * This API route uses edge-compatible functions and avoids Node.js specific APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { createNeonAdapter } from '@/lib/driver-adapters/prisma-neon';
// Import edge-compatible hashing function explicitly
import { hashPasswordEdge } from '@/lib/auth-utils-edge';

// Specify Edge runtime explicitly
export const runtime = 'edge';

// Use dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

/**
 * Get Prisma client optimized for edge runtime
 */
async function getEdgePrismaClient() {
  const adapter = createNeonAdapter();
  return new PrismaClient({ adapter });
}

/**
 * GET handler for retrieving users with full capabilities
 */
export async function GET(request: NextRequest) {
  try {
    // Get edge-optimized Prisma client
    const db = await getEdgePrismaClient();

    // Get user ID using edge-compatible method
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      await db.$disconnect().catch(console.error);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user has admin privileges
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!currentUser || currentUser.role !== 'admin') {
      await db.$disconnect().catch(console.error);
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
    const users = await db.user.findMany({
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
            websiteUrl: true,
            businessDescription: true,
            competitors: true,
            sitemapUrl: true,
            hasGoogleSearchConsole: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Count total users separately
    const total = await db.user.count({ where: whereClause });
    
    // Clean up connection
    await db.$disconnect().catch(console.error);
    
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
    console.error('Error in Edge users API:', error);
    
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
 * Using edge-compatible functionality
 */
export async function POST(request: NextRequest) {
  try {
    // Get edge-optimized Prisma client
    const db = await getEdgePrismaClient();

    // Get user ID using edge-compatible method
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      await db.$disconnect().catch(console.error);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user has admin privileges
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!currentUser || currentUser.role !== 'admin') {
      await db.$disconnect().catch(console.error);
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      await db.$disconnect().catch(console.error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    const { name, email, password, role } = data || {};
    
    // Validate input
    if (!name || !email || !password) {
      await db.$disconnect().catch(console.error);
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      await db.$disconnect().catch(console.error);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Use edge-compatible password hashing directly
    // const { hashPassword } = await import('@/lib/server-auth-utils'); // Remove dynamic import
    const hashedPassword = await hashPasswordEdge(password);
    
    // Create user
    const newUser = await db.user.create({
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
    await db.settings.create({
      data: {
        userId: newUser.id,
        websiteUrl: '',
        businessDescription: '',
        sitemapUrl: '',
        hasGoogleSearchConsole: false
      }
    });
    
    // Clean up connection
    await db.$disconnect().catch(console.error);
    
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