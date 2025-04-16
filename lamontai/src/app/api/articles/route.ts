// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db'; // Import getter
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Mark this route as dynamic since it accesses request properties
export const dynamic = 'force-dynamic';

// Specify the runtime
export const runtime = 'nodejs';

// GET /api/articles - Get all articles for user
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseClient(); // Await client
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentPlanId = searchParams.get('contentPlanId');
    
    const whereClause: any = { userId };
    if (contentPlanId) {
      whereClause.contentPlanId = contentPlanId;
    }

    const articles = await db.article.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: { // Select only necessary fields for list view
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        contentPlanId: true,
      }
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json({ message: "Failed to fetch articles" }, { status: 500 });
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient(); // Await client
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, status, contentPlanId } = body;
    
    // Validate required fields
    if (!title) {
        return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const newArticle = await db.article.create({
      data: {
        title,
        content: content || '', // Default empty string if null/undefined
        status: status || 'draft', // Default to draft if not provided
        userId,
        contentPlanId,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json({ message: "Failed to create article" }, { status: 500 });
  }
} 