import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db';

/**
 * Generate content based on provided prompt parameters
 * 
 * @param req NextRequest with body containing prompt parameters
 * @returns NextResponse with generated content
 */
export async function POST(req: NextRequest) {
  try {
    // Extract authorization token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      );
    }
    
    // Rate limiting handled by middleware
    // Authentication handled by middleware
    
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.topic || !body.keywords || !body.length) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, keywords, and length are required' },
        { status: 400 }
      );
    }
    
    // Log the request
    logger.info(`Content generation request for topic: ${body.topic}`);
    
    // You would normally call OpenAI API here, but for demonstration:
    // Create mock response
    const mockResponse = {
      title: `${body.topic}: A Comprehensive Guide`,
      content: `This is a generated article about ${body.topic} with keywords: ${body.keywords.join(', ')}. 
      The article is approximately ${body.length} words long.
      
      ## Introduction
      In this article, we will explore the fascinating world of ${body.topic}.
      
      ## Main Points
      1. First important aspect of ${body.topic}
      2. Second important consideration
      3. Key strategies for success
      
      ## Conclusion
      By understanding these key aspects of ${body.topic}, you'll be well positioned for success.`,
      metadata: {
        wordCount: body.length,
        keywords: body.keywords,
        generationTime: new Date().toISOString(),
      }
    };
    
    // Track the generation in the database
    await prisma.contentGeneration.create({
      data: {
        userId: 'user-id', // In a real app, this would come from the authenticated user
        topic: body.topic,
        keywords: body.keywords,
      },
    });
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    logger.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 