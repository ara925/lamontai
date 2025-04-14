// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

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
      orderBy: { updatedAt: 'desc' }
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
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Create a new article with minimal fields to avoid type issues
    const article = await db.article.create({
      data: {
        title: body.title,
        content: body.content || '',
        userId: userId
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