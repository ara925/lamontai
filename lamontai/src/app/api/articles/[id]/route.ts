import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Configure for node.js runtime compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fix the TypeError with split function by adding proper null checks and type guards
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    
    const article = await db.article.findUnique({
      where: { id: params.id, userId: userId },
    });

    if (!article) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return NextResponse.json({ message: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, status, keywords, metaDescription } = body;
    
    // Validate required fields
    if (!title) {
        return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const updatedArticle = await db.article.update({
      where: { id: params.id, userId: userId },
      data: {
        title,
        content,
        status,
        keywords,
        metaDescription,
        // Optionally update publishedAt based on status
        publishedAt: status === 'published' ? new Date() : (status === 'draft' ? null : undefined),
      },
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error("Failed to update article:", error);
    // Handle potential Prisma errors like record not found
    if ((error as any).code === 'P2025') { // Prisma code for RecordNotFound
        return NextResponse.json({ message: "Article not found or you don't have permission to update it" }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    await db.article.delete({
      where: { id: params.id, userId: userId },
    });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Failed to delete article:", error);
    // Handle potential Prisma errors like record not found
     if ((error as any).code === 'P2025') { // Prisma code for RecordNotFound
        return NextResponse.json({ message: "Article not found or you don't have permission to delete it" }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to delete article" }, { status: 500 });
  }
} 