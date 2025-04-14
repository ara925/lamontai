import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import '@/lib/auth-types'; // Import the type declarations
import { generateContentSchema, validateRequest, formatZodErrors } from '@/lib/validation';
import { PLAN_LIMITS, USER_PLANS } from '@/lib/api-config';
import { handleApiError } from '@/lib/error-handler';

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
async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }

    // Parse and validate the request data
    const requestData = await req.json();
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
    
    if (session && session.user) {
      // Add type assertion here
      const userId = (session.user as any).id;
      // Lookup user plan from database
      // In production, you'd fetch this from your database
      userPlan = USER_PLANS[userId as keyof typeof USER_PLANS] || 'free';
      
      // Mock usage tracking - in real app, get from database
      articlesGenerated = 3;
    }
    
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

// Export the handler with middleware
export const POST = withApiMiddleware(handler); 