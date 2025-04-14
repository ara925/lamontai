// export const runtime = 'nodejs'; // Remove runtime config

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/server-auth-utils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export async function GET(req: NextRequest) {
  try {
    console.log('API: Profile request received');
    
    // Get the token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('API: No bearer token provided');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required' 
        }, 
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    console.log('API: Token received:', token.substring(0, 15) + '...');
    
    try {
      // Verify the token
      const decoded = await verifyJWT(token);
      console.log('API: Token verified, user ID:', decoded.id);
      
      // Check if user exists in database
      const user = await db.user.findUnique({
        where: { id: decoded.id },
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
      
    } catch (tokenError) {
      console.log('API: Token verification failed', tokenError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid or expired token' 
        }, 
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('API: Profile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Get the user session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({
      success: false,
      message: "Not authenticated"
    }, { status: 401 });
  }
  
  try {
    const userId = session.user.id;
    const updates = await request.json();
    
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