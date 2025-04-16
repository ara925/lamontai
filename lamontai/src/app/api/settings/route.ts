// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db'; // Import getter
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Explicitly configure for edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Schema for validating settings update
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['english', 'spanish', 'french', 'german']).optional(),
  notifications: z.boolean().optional(),
});

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseClient(); // Await client
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const settings = await db.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
        // If settings don't exist, maybe create them with defaults?
        // Or return a specific status/message indicating no settings found.
        // For now, return null or default structure
        return NextResponse.json({ 
            theme: 'light', language: 'english', notifications: true 
            // Add other default fields from your schema if necessary
        }); 
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ message: "Failed to fetch settings" }, { status: 500 });
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
    
    // Create a properly typed update object
    const updateData: any = {};
    if (result.data.theme !== undefined) updateData.theme = result.data.theme;
    if (result.data.language !== undefined) updateData.language = result.data.language;
    if (result.data.notifications !== undefined) updateData.notifications = result.data.notifications;
    
    // Update settings
    const db = await getDatabaseClient();
    const settings = await db.settings.update({
      where: { userId },
      data: updateData
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
  try {
    const db = await getDatabaseClient(); // Await client
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate or sanitize body input here if needed
    const { theme, language, notifications, apiKey, ...otherSettings } = body;

    // Prepare data for update, only include fields present in the request
    const dataToUpdate: any = {};
    if (theme !== undefined) dataToUpdate.theme = theme;
    if (language !== undefined) dataToUpdate.language = language;
    if (notifications !== undefined) dataToUpdate.notifications = notifications;
    if (apiKey !== undefined) dataToUpdate.apiKey = apiKey; // Be cautious with API key updates
    // Add other updatable settings fields here
    // Example: if (otherSettings.someField !== undefined) dataToUpdate.someField = otherSettings.someField;

    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update" }, { status: 400 });
    }

    const updatedSettings = await db.settings.update({
      where: { userId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Failed to update settings:", error);
     // Handle potential Prisma errors like record not found if upsert isn't used
     if ((error as any).code === 'P2025') { 
        // Optionally, create settings if they don't exist (upsert pattern)
        // For now, return error
        return NextResponse.json({ message: "Settings not found for this user." }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
} 