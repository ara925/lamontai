import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import '@/lib/auth-types'; // Import the type declarations
import { generateContentSchema, validateRequest, formatZodErrors } from '@/lib/validation';
import { PLAN_LIMITS, USER_PLANS } from '@/lib/api-config';

// Mock data for demo purposes
const demoResponse = {
  title: "How to Optimize Your Content for Better SEO Rankings",
  content: `
    <h2>Introduction</h2>
    <p>Search engine optimization (SEO) is critical for any business looking to increase visibility online. In this comprehensive guide, we'll explore proven strategies to optimize your content for better SEO rankings.</p>
    
    <h2>Understanding Keyword Research</h2>
    <p>Effective keyword research forms the foundation of any successful SEO strategy. By identifying the terms and phrases your target audience is searching for, you can create content that directly addresses their needs.</p>
    
    <h2>On-Page Optimization Techniques</h2>
    <p>On-page optimization involves optimizing specific elements of your website to improve its search engine rankings. This includes optimizing title tags, meta descriptions, header tags, and ensuring proper keyword placement throughout your content.</p>
    
    <h2>Creating High-Quality Content</h2>
    <p>Google's algorithms increasingly prioritize content that provides genuine value to users. Focus on creating comprehensive, well-researched articles that thoroughly address the user's search intent.</p>
    
    <h2>Building a Strong Backlink Profile</h2>
    <p>Backlinks remain one of the most important ranking factors for search engines. Develop a strategy to earn high-quality backlinks from reputable websites in your industry.</p>
    
    <h2>Conclusion</h2>
    <p>Implementing these SEO optimization strategies will help improve your content's visibility in search results, driving more organic traffic to your website and increasing your chances of converting visitors into customers.</p>
  `,
  keywords: ["SEO optimization", "content strategy", "keyword research", "backlink building", "on-page SEO"],
  readabilityScore: 85,
  wordCount: 1500,
  estimatedRank: "Top 10 potential"
};

// Define the type for the request body based on the schema
type GenerateContentRequest = {
  topic: string;
  keywords: string[];
  options?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
  };
};

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({
      success: false,
      message: "Authentication required"
    }, { status: 401 });
  }
  
  try {
    // Parse and validate the request data
    const requestData = await request.json();
    const validationResult = validateRequest<GenerateContentRequest>(generateContentSchema, requestData);
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid request data",
        errors: formatZodErrors(validationResult.error)
      }, { status: 400 });
    }
    
    const { topic, keywords, options } = validationResult.data;
    
    // Get the user's plan and usage
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
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, we're returning mock data
    // In production, you would call your AI service here with the validated data
    // const generatedContent = await aiService.generateArticle(topic, keywords, options);
    
    // Customize the demo response with the user's input
    const customizedResponse = {
      ...demoResponse,
      title: `How to ${topic} - A Comprehensive Guide`,
      keywords: keywords
    };
    
    return NextResponse.json({
      success: true,
      message: "Article generated successfully",
      data: customizedResponse
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate article",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 