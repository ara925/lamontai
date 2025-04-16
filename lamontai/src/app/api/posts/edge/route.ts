/**
 * Edge-compatible Posts API endpoint
 * This API route is specifically designed to run in the Edge runtime
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWTEdge, getTokenFromRequestEdge } from '@/lib/auth-utils-edge';
import { createNeonAdapter } from '@/lib/driver-adapters/prisma-neon';

// Specify Edge runtime
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
 * GET handler for retrieving articles
 */
export async function GET(request: NextRequest) {
  try {
    // Get database client optimized for Cloudflare
    const prisma = await getEdgePrismaClient();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      20 // MAX_ARTICLES
    );
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Query articles with limited fields for Edge performance
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          createdAt: true,
          user: {
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
      prisma.article.count()
    ]);

    // Clean up connection
    await prisma.$disconnect().catch(console.error);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    // Return the articles with pagination
    return new Response(
      JSON.stringify({
        articles,
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
    console.error('Error in edge articles API:', error);
    
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
 * POST handler for creating an article
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
    const { title, content, status = 'draft' } = data;
    
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
    const prisma = await getEdgePrismaClient();
    
    // Create article
    const article = await prisma.article.create({
      data: {
        title,
        content,
        status,
        userId: payload.sub as string,
        keywords: data.keywords || []
      },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Clean up connection
    await prisma.$disconnect().catch(console.error);

    // Return the created article
    return new Response(
      JSON.stringify({
        message: 'Article created successfully',
        article
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating article:', error);
    
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