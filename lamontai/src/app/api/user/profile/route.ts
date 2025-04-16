// Add runtime config for edge
export const runtime = 'edge'; 
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

export async function GET(req: NextRequest) {
  try {
    console.log('API: Profile request received');
    const db = await getDatabaseClient();
    
    // Get user ID using edge-compatible method
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      console.log('API: Authentication failed');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required' 
        }, 
        { status: 401 }
      );
    }
    
    console.log('API: User authenticated, ID:', userId);
    
    // Check if user exists in database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      console.log('API: User not found in database');
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found' 
        }, 
        { status: 404 }
      );
    }
    
    console.log('API: User found in database:', user.email);
    
    // Return user data
    return NextResponse.json(
      { 
        success: true, 
        data: user 
      }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error('API: Profile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    // Get user ID using edge-compatible method
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Not authenticated"
      }, { status: 401 });
    }
    
    // Parse the request body with error handling
    let updates;
    try {
      updates = await request.json();
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: "Invalid request body"
      }, { status: 400 });
    }
    
    // Find the user in the database
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        settings: true
      }
    });
    
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: "User profile not found"
      }, { status: 404 });
    }
    
    // Update the user profile in the database
    // We'll only allow updating specific fields
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: updates.name !== undefined ? updates.name : existingUser.name,
        // Never update email through this endpoint for security reasons
        // email: updates.email !== undefined ? updates.email : existingUser.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // If preferences are included, update settings separately
    if (updates.preferences) {
      // Create a properly typed update object
      const settingsUpdateData: any = {};
      
      if (updates.preferences.theme !== undefined) {
        settingsUpdateData.theme = updates.preferences.theme;
      }
      
      if (updates.preferences.emailNotifications !== undefined) {
        settingsUpdateData.notifications = updates.preferences.emailNotifications;
      }
      
      if (updates.preferences.contentType !== undefined) {
        settingsUpdateData.language = updates.preferences.contentType;
      }
      
      await db.settings.update({
        where: { userId },
        data: settingsUpdateData
      });
    }
    
    // Format response data structure to match expected format
    const responseData = {
      ...updatedUser,
      preferences: {
        theme: (existingUser.settings as any)?.theme || 'light',
        emailNotifications: (existingUser.settings as any)?.notifications || false,
        contentType: (existingUser.settings as any)?.language || 'english'
      }
    };
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: responseData
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update user profile",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 