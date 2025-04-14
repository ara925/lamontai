import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { db } from '@/lib/db';
import { getCachedSitemapData, findRelevantInternalLinks } from '@/lib/sitemap-utils';

// Validation schema for the request
const relevantLinksSchema = z.object({
  topic: z.string().min(2, { message: "Topic must be at least 2 characters" }),
  maxResults: z.number().int().min(1).max(20).default(5)
});

export async function POST(request: NextRequest) {
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
    
    // Parse and validate request body
    const body = await request.json();
    const validation = relevantLinksSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request format',
          errors: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        }, 
        { status: 400 }
      );
    }
    
    const { topic, maxResults } = validation.data;
    
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
      
      // Find relevant internal links for the topic
      const relevantLinks = await findRelevantInternalLinks(sitemapData, topic, maxResults);
      
      return NextResponse.json(
        { 
          success: true,
          data: {
            topic,
            links: relevantLinks,
            count: relevantLinks.length
          }
        }, 
        { status: 200 }
      );
    } catch (error) {
      console.error('Error finding relevant links:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to find relevant links',
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