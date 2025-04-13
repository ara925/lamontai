// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Schema for validating content plan creation/update
const contentPlanSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  status: z.enum(['draft', 'in-progress', 'completed']).optional(),
});

// GET /api/content-plans - Get all content plans for user
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Find all content plans for user
    const contentPlans = await db.contentPlan.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true
          }
        }
      }
    });
    
    return NextResponse.json(
      { success: true, data: contentPlans },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching content plans:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching content plans' },
      { status: 500 }
    );
  }
}

// POST /api/content-plans - Create a new content plan
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
    const result = contentPlanSchema.safeParse(body);
    
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
    
    // Create a new content plan
    const contentPlan = await db.contentPlan.create({
      data: {
        ...result.data,
        userId
      }
    });
    
    return NextResponse.json(
      { success: true, data: contentPlan },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating content plan:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating content plan' },
      { status: 500 }
    );
  }
} 