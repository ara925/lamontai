import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { generateContentSchema, validateRequest, formatZodErrors } from '@/lib/validation';
import { PLAN_LIMITS, USER_PLANS } from '@/lib/api-config';
import { handleApiError } from '@/lib/error-handler';

// Configure for nodejs runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mock response for local development
const mockGeneratedContent = {
  title: "How to Improve Your SEO Strategy in 2023",
  content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
  keywords: ["SEO", "content marketing", "digital strategy"],
  readabilityScore: 87.5,
  wordCount: 1250,
  estimatedRank: "Top 10 potential"
};

/**
 * API route handler for generating content
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication using more robust method
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }

    // Parse and validate the request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: "Invalid JSON in request body"
      }, { status: 400 });
    }
    
    const validationResult = validateRequest(generateContentSchema, requestData);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid request data",
        errors: formatZodErrors(validationResult.error)
      }, { status: 400 });
    }

    const { topic, keywords, options } = validationResult.data;

    // Get the user's plan from session or database
    let userPlan = 'free';
    let articlesGenerated = 0;
    
    // In production, you'd fetch this from your database
    userPlan = USER_PLANS[userId as keyof typeof USER_PLANS] || 'free';
      
    // Mock usage tracking - in real app, get from database
    articlesGenerated = 3;
    
    // Check if user has reached their article generation limit
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
    if (articlesGenerated >= planLimits.articlesPerMonth) {
      return NextResponse.json({
        success: false,
        message: "You have reached your monthly article generation limit. Please upgrade your plan to continue."
      }, { status: 403 });
    }
    
    // Return a mock response
    return NextResponse.json({
      success: true,
      message: "Article generated successfully",
      data: {
        ...mockGeneratedContent,
        title: `How to ${topic} - A Comprehensive Guide`,
        keywords: keywords || ["SEO", "content", "digital marketing"]
      }
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, req);
  }
} 