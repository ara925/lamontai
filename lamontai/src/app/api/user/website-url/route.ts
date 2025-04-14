import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyToken, getUserIdFromRequest } from '@/lib/server-auth-utils';

// Validation schema for the website URL
const websiteUrlSchema = z.object({
  websiteUrl: z.string().url({ message: "Invalid URL format" })
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
    const validation = websiteUrlSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid website URL format',
          errors: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        }, 
        { status: 400 }
      );
    }
    
    const { websiteUrl } = validation.data;
    
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
      
      // Log the incoming website URL for debugging
      console.log(`Saving website URL for user ${userId}: ${websiteUrl}`);

      // Check if user has settings, create if not
      let updatedSettings;
      if (!user.settings) {
        // Create new settings record
        updatedSettings = await db.settings.create({
          data: {
            userId: user.id,
            websiteUrl
          } as any // Type assertion for new fields
        });
      } else {
        // Update existing settings
        updatedSettings = await db.settings.update({
          where: { userId: user.id },
          data: { 
            websiteUrl,
            updatedAt: new Date()
          } as any // Type assertion for new fields
        });
      }

      console.log(`Successfully saved website URL: ${(updatedSettings as any).websiteUrl}`);
      
      return NextResponse.json(
        { 
          success: true,
          message: 'Website URL saved successfully',
          data: { websiteUrl: (updatedSettings as any).websiteUrl }
        }, 
        { status: 200 }
      );
    } catch (error) {
      console.error('Error saving website URL:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to save website URL',
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