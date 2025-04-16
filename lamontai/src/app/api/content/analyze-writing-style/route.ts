import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { getCachedSitemapData, analyzeUrlContent } from '@/lib/sitemap-utils';
import { OpenAI } from 'openai';

// Specify the runtime
export const runtime = 'nodejs';

// Mark this route as dynamic since it accesses request properties
export const dynamic = 'force-dynamic';

// Instantiate OpenAI client outside handler for potential reuse
// Ensure process.env.OPENAI_API_KEY is available in edge runtime environment
const openai = new OpenAI();

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required' 
        }, 
        { status: 401 }
      );
    }
    
    // Get the search params
    const maxArticles = parseInt(request.nextUrl.searchParams.get('maxArticles') || '5', 10);
    
    try {
      // Fetch user's sitemap URL from settings
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { settings: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false,
            message: 'User not found' 
          }, 
          { status: 404 }
        );
      }
      
      // Check if user has a sitemap URL
      if (!user.settings || !(user.settings as any).sitemapUrl) {
        return NextResponse.json(
          { 
            success: false,
            message: 'No sitemap URL found for this user' 
          }, 
          { status: 404 }
        );
      }
      
      // Get cached sitemap data or fetch if not in cache
      const sitemapData = await getCachedSitemapData((user.settings as any).sitemapUrl);
      
      // Analyze a few most recent articles to understand writing style
      // Limit the number of articles to analyze to avoid overloading
      const urlsToAnalyze = sitemapData.urls
        .sort((a, b) => {
          // Sort by lastmod date if available (most recent first)
          if (a.lastmod && b.lastmod) {
            return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
          }
          return 0;
        })
        .slice(0, Math.min(maxArticles, 10));
      
      console.log(`Analyzing ${urlsToAnalyze.length} articles for writing style`);
      
      // Analyze each URL in parallel
      const analysisPromises = urlsToAnalyze.map(url => analyzeUrlContent(url.loc));
      const analysisResults = await Promise.all(analysisPromises);
      
      // Extract common keywords, average sentence length, etc.
      const allKeywords = analysisResults.flatMap(result => result.keywords);
      const keywordFrequency: Record<string, number> = {};
      
      allKeywords.forEach(keyword => {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
      });
      
      // Get top keywords
      const topKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword]) => keyword);
      
      // Calculate average word count
      const totalWordCount = analysisResults.reduce((sum, result) => {
        return sum + (result.wordCount || 0);
      }, 0);
      const averageWordCount = totalWordCount / analysisResults.length;
      
      // Extract headings
      const allHeadings = analysisResults.flatMap(result => result.headings);
      
      // Analyze the writing style (simplified)
      const writingStyle = {
        topKeywords,
        averageWordCount,
        headingCount: allHeadings.length,
        analyzedArticles: analysisResults.length,
        sampleHeadings: allHeadings.slice(0, 10)
      };
      
      return NextResponse.json(
        { 
          success: true,
          data: {
            writingStyle,
            analysisDetails: analysisResults
          }
        }, 
        { status: 200 }
      );
    } catch (error) {
      console.error('Error analyzing writing style:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to analyze writing style',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { sampleText } = body;

    if (!sampleText || typeof sampleText !== 'string' || sampleText.trim().length < 100) {
      return NextResponse.json({ message: "A sample text of at least 100 characters is required" }, { status: 400 });
    }

    // Limit sample text size to prevent excessive API usage
    const truncatedText = sampleText.slice(0, 5000);

    // Call OpenAI API to analyze writing style
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use a cost-effective model for analysis
      messages: [
        {
          role: "system",
          content: "Analyze the following text and describe the author's writing style in a concise paragraph. Focus on tone, complexity, sentence structure, and overall voice. Output only the description.",
        },
        { role: "user", content: truncatedText },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const writingStyle = completion.choices[0]?.message?.content?.trim();

    if (!writingStyle) {
      return NextResponse.json({ message: "Failed to analyze writing style" }, { status: 500 });
    }

    // Optionally, save the analyzed style to user settings (ensure settings exist)
    await db.settings.upsert({
        where: { userId },
        update: { writingStyleDescription: writingStyle }, // Add field to Settings model if needed
        create: {
            userId,
            writingStyleDescription: writingStyle
        }
    });

    return NextResponse.json({ success: true, writingStyle });
  } catch (error) {
    console.error("Failed to analyze writing style:", error);
    return NextResponse.json({ message: "Failed to analyze writing style" }, { status: 500 });
  }
} 