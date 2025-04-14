import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { initializeUserSitemap } from '@/lib/sitemap-utils';

// Validation schema for the sitemap URL (optional)
const sitemapSchema = z.object({
  sitemapUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal(''))
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
    const validation = sitemapSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid sitemap URL format',
          errors: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        }, 
        { status: 400 }
      );
    }
    
    const { sitemapUrl } = validation.data;
    
    // Check database connection
    try {
      await db.$connect();
      console.log('API: Database connection successful');
    } catch (dbError) {
      console.error('API: Database connection error:', dbError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Database connection failed'
        }, 
        { status: 500 }
      );
    }
    
    try {
      // Check if user exists
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
      
      // Update user settings with sitemap URL
      // Check if user has settings, create if not
      if (!user.settings) {
        // Create new settings record
        await db.settings.create({
          data: {
            userId: user.id,
            // Use type assertion for new fields until prisma schema is updated
            ...(sitemapUrl ? { sitemapUrl } : {}) as any
          }
        });
      } else {
        // Update existing settings
        await db.settings.update({
          where: { userId: user.id },
          data: { 
            // Use type assertion for new fields
            ...(sitemapUrl ? { sitemapUrl } : {}) as any,
            updatedAt: new Date()
          }
        });
      }
      
      // If sitemap URL is provided, initialize sitemap data in the background
      if (sitemapUrl) {
        // Process sitemap in the background without blocking the response
        // We don't await this call since it might take a while for large sitemaps
        initializeUserSitemap(userId, sitemapUrl)
          .then(success => {
            if (success) {
              console.log(`Successfully initialized sitemap for user ${userId}`);
            } else {
              console.error(`Failed to initialize sitemap for user ${userId}`);
            }
          })
          .catch(error => {
            console.error(`Error during sitemap initialization for user ${userId}:`, error);
          });
      }
      
      return NextResponse.json(
        { 
          success: true,
          message: 'Sitemap URL saved successfully'
        }, 
        { status: 200 }
      );
    } catch (error) {
      console.error('Error saving sitemap URL:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to save sitemap URL',
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
  } finally {
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 