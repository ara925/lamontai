/**
 * Edge-compatible Posts API endpoint
 * This API route is specifically designed to run in the Edge runtime
 */

import { NextRequest } from 'next/server';
import { getNeonPrismaClient } from '@/lib/prisma-cloudflare';
import { verifyJWTEdge, getTokenFromRequestEdge } from '@/lib/auth-utils-edge';

// Specify Edge runtime
export const runtime = 'edge';

// Use dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Limit query complexity for Edge runtime
const MAX_POSTS = 20;

/**
 * GET handler for retrieving posts
 */
export async function GET(request: NextRequest) {
  try {
    // Get database client optimized for Cloudflare
    const prisma = await getNeonPrismaClient();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      MAX_POSTS
    );
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Query posts with limited fields for Edge performance
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.post.count()
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    // Return the posts with pagination
    return new Response(
      JSON.stringify({
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in edge posts API:', error);
    
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

/**
 * POST handler for creating a post
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const token = getTokenFromRequestEdge(request);
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the token
    const payload = await verifyJWTEdge(token);
    if (!payload || !payload.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const data = await request.json();
    const { title, content, published = false } = data;
    
    // Validate input
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get database client optimized for Cloudflare
    const prisma = await getNeonPrismaClient();
    
    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId: payload.sub as string
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Return the created post
    return new Response(
      JSON.stringify({
        message: 'Post created successfully',
        post
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    
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