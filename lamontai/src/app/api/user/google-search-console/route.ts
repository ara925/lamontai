import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Define runtime and dynamic behavior
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validation schema for the Google Search Console connection
const gscConnectionSchema = z.object({
  connected: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    // Verify user authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = gscConnectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid request format', errors: validation.error.issues }, { status: 400 });
    }
    
    const { connected } = validation.data;
    
    // Update settings using upsert
    await db.settings.upsert({
      where: { userId },
      update: { hasGoogleSearchConsole: connected },
      create: { userId, hasGoogleSearchConsole: connected },
    });
      
    return NextResponse.json({
      success: true,
      message: connected 
        ? 'Successfully updated Google Search Console connection status' 
        : 'Google Search Console connection status removed'
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving Google Search Console connection status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to save Google Search Console connection status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    try {
        const db = await getDatabaseClient();
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
        }

        const settings = await db.settings.findUnique({
            where: { userId },
            select: { hasGoogleSearchConsole: true },
        });

        return NextResponse.json({ success: true, isConnected: settings?.hasGoogleSearchConsole || false });

    } catch (error) {
        console.error("Error fetching GSC connection status:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch GSC connection status" }, { status: 500 });
    }
} 