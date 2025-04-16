// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db'; // Import getter
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';
import { PrismaClient, ContentPlan } from '@prisma/client';

// Schema for validating content plan creation/update
const contentPlanSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  status: z.enum(['draft', 'in-progress', 'completed']).optional(),
});

// GET /api/content-plans - Get all content plans for user
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseClient(); // Await client
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const plans = await db.contentPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        _count: { select: { articles: true } } // Include article count
      }
    });

    // Map to include article count directly
    const plansWithCount = plans.map((plan: ContentPlan & { _count: { articles: number } }) => ({
      ...plan,
      articleCount: plan._count.articles
    }));

    return NextResponse.json(plansWithCount);
  } catch (error) {
    console.error("Failed to fetch content plans:", error);
    return NextResponse.json({ message: "Failed to fetch content plans" }, { status: 500 });
  }
}

// POST /api/content-plans - Create a new content plan
export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient(); // Await client
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const newPlan = await db.contentPlan.create({
      data: {
        title,
        description: description || '',
        userId,
        status: 'draft', // Default status
      },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Failed to create content plan:", error);
    return NextResponse.json({ message: "Failed to create content plan" }, { status: 500 });
  }
} 