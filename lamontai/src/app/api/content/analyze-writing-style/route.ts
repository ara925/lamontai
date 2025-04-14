import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { db } from '@/lib/db';
import { getCachedSitemapData, analyzeUrlContent } from '@/lib/sitemap-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
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