import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Configure for nodejs runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using a method that works in all environments
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    // Safely parse JSON with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({
        success: false,
        message: "Invalid JSON input"
      }, { status: 400 });
    }
    
    // Defensively extract and validate fields
    const url = body?.url;
    const content = body?.content;
    const keywords = body?.keywords;
    
    if ((!url && !content) || !keywords) {
      return NextResponse.json({
        success: false,
        message: "You must provide either a URL or content to analyze, along with target keywords"
      }, { status: 400 });
    }
    
    // Generate search keywords array safely
    let keywordsArray: string[] = [];
    
    if (Array.isArray(keywords)) {
      keywordsArray = keywords.filter(k => typeof k === 'string');
    } else if (typeof keywords === 'string') {
      keywordsArray = [keywords];
    } else {
      console.warn('Keywords provided in an unusable format:', keywords);
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response data - in a real implementation, this would be generated by analyzing the content
    const analysis = {
      seoScore: 87,
      readabilityScore: 92,
      keywordDensity: {
        primary: 2.3, // percentage
        secondary: keywordsArray.length > 1 ? 1.7 : 0
      },
      contentLength: {
        words: 1450,
        characters: 8700,
        paragraphs: 12
      },
      suggestions: [
        "Add more internal links to improve site structure",
        "Consider adding a table of contents for longer articles",
        "Add more examples to illustrate key points",
        "The meta description could be more compelling",
      ],
      headingStructure: {
        h1: 1,
        h2: 5,
        h3: 8,
        h4: 3
      },
      keywordUsage: {
        title: true,
        metaDescription: true,
        firstParagraph: true,
        headings: true,
        imageAlt: false
      },
      competitors: [
        {
          url: "https://example.com/similar-article",
          title: "Similar Topic Article",
          strengths: ["More comprehensive content", "Better use of schema markup"],
          weaknesses: ["Older publication date", "Fewer examples"]
        },
        {
          url: "https://competitor.com/related-content",
          title: "Related Content Guide",
          strengths: ["Higher domain authority", "More backlinks"],
          weaknesses: ["Less specific to the search intent", "Poorer readability score"]
        }
      ],
      technicalIssues: [
        "Page could load faster with image optimization",
        "Consider implementing AMP for mobile users"
      ]
    };
    
    return NextResponse.json({
      success: true,
      message: "Analysis completed successfully",
      data: analysis
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to analyze content",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 