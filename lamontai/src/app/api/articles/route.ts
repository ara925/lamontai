// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Schema for validating article creation/update
const articleSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  contentPlanId: z.string().optional(),
  keywords: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  publishedAt: z.date().optional().nullable(),
});

// GET /api/articles - Get all articles for user
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const contentPlanId = url.searchParams.get('contentPlanId');
    const status = url.searchParams.get('status');
    
    // Build where clause
    const where: any = { userId };
    if (contentPlanId) where.contentPlanId = contentPlanId;
    if (status) where.status = status;
    
    // Find all articles for user with optional filters
    const articles = await db.article.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        contentPlan: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    return NextResponse.json(
      { success: true, data: articles },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching articles' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate the request data
    const result = articleSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Validation failed', 
          errors: result.error.errors 
        }, 
        { status: 400 }
      );
    }
    
    // If contentPlanId is provided, check if it belongs to the user
    if (result.data.contentPlanId) {
      const contentPlan = await db.contentPlan.findFirst({
        where: {
          id: result.data.contentPlanId,
          userId
        }
      });
      
      if (!contentPlan) {
        return NextResponse.json(
          { success: false, message: 'Content plan not found or not owned by user' },
          { status: 404 }
        );
      }
    }
    
    // Create a new article
    const article = await db.article.create({
      data: {
        ...result.data,
        userId
      }
    });
    
    return NextResponse.json(
      { success: true, data: article },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating article' },
      { status: 500 }
    );
  }
} 