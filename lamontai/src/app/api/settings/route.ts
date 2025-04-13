// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Schema for validating settings update
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['english', 'spanish', 'french', 'german']).optional(),
  notifications: z.boolean().optional(),
});

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Find user with settings
    const settings = await db.settings.findUnique({
      where: { userId }
    });
    
    if (!settings) {
      return NextResponse.json(
        { success: false, message: 'Settings not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate the request data
    const result = settingsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Validation failed', 
          errors: result.error.errors 
        }, 
        { status: 400 }
      );
    }
    
    // Update settings
    const settings = await db.settings.update({
      where: { userId },
      data: result.data
    });
    
    return NextResponse.json(
      { success: true, data: settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate the request data
    const result = settingsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Validation failed', 
          errors: result.error.errors 
        }, 
        { status: 400 }
      );
    }
    
    // Update settings using upsert (update or create if not exists)
    const updatedSettings = await db.settings.upsert({
      where: { userId },
      update: result.data, // Fields to update if record exists
      create: { userId, ...result.data } // Fields to use if record needs to be created
    });
    
    return NextResponse.json(
      { success: true, data: updatedSettings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating settings' },
      { status: 500 }
    );
  }
} 