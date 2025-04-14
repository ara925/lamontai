import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Validate the request body
const targetAudienceSchema = z.object({
  targetLanguages: z.array(z.string()).min(1, 'At least one language must be selected'),
  audienceSize: z.number().int().positive('Audience size must be a positive number'),
});

export async function POST(req: NextRequest) {
  try {
    // Get user ID from the request (using JWT)
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    
    // Validate with zod schema
    const validation = targetAudienceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.message },
        { status: 400 }
      );
    }

    const { targetLanguages, audienceSize } = validation.data;

    // Check database connection
    try {
      await db.$connect();
      console.log('API: Database connection successful');
    } catch (dbError) {
      console.error('API: Database connection error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
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
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Update user settings with target audience data
      // Check if user has settings, create if not
      let settings;
      if (!user.settings) {
        // Create new settings record
        settings = await db.settings.create({
          data: {
            userId: user.id,
            // Use type assertion for new fields until prisma schema is updated
            targetLanguages: JSON.stringify(targetLanguages),
            audienceSize
          } as any
        });
      } else {
        // Update existing settings
        settings = await db.settings.update({
          where: { userId: user.id },
          data: { 
            // Use type assertion for new fields
            targetLanguages: JSON.stringify(targetLanguages),
            audienceSize,
            updatedAt: new Date()
          } as any
        });
      }
      
      // Log completion of onboarding
      console.log(`User ${userId} completed onboarding with target languages: ${targetLanguages.join(', ')}`);

      return NextResponse.json({ 
        success: true, 
        message: 'Target audience settings saved successfully',
        data: settings
      });
    } catch (error: any) {
      console.error('Error saving target audience:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to save target audience settings',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
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