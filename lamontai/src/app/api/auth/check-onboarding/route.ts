import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

// Explicitly set edge runtime for Cloudflare compatibility
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ onboarded: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's settings
    const settings = await db.settings.findUnique({
      where: { userId },
      select: {
        websiteUrl: true,
        businessDescription: true,
      },
    });

    // Determine onboarding status based on whether essential settings are filled
    // Adjust the logic based on your specific onboarding requirements
    const isOnboarded = !!(settings?.websiteUrl && settings?.businessDescription);

    return NextResponse.json({ onboarded: isOnboarded });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ onboarded: false, message: 'Internal server error' }, { status: 500 });
  }
} 