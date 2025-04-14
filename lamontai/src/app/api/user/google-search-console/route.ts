import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Validation schema for the Google Search Console connection
const gscConnectionSchema = z.object({
  connected: z.boolean().default(false)
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
    const validation = gscConnectionSchema.safeParse(body);
    
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
    
    const { connected } = validation.data;
    
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
      
      // Update user settings with GSC connection status
      // Check if user has settings, create if not
      if (!user.settings) {
        // Create new settings record
        await db.settings.create({
          data: {
            userId: user.id,
            // Use type assertion for new fields until prisma schema is updated
            hasGoogleSearchConsole: connected
          } as any
        });
      } else {
        // Update existing settings
        await db.settings.update({
          where: { userId: user.id },
          data: { 
            // Use type assertion for new fields
            hasGoogleSearchConsole: connected,
            updatedAt: new Date()
          } as any
        });
      }
      
      return NextResponse.json(
        { 
          success: true,
          message: connected 
            ? 'Successfully connected to Google Search Console' 
            : 'Google Search Console connection removed'
        }, 
        { status: 200 }
      );
    } catch (error) {
      console.error('Error saving Google Search Console connection status:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to save Google Search Console connection status',
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