import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';

export async function GET(req: NextRequest) {
  try {
    // Get user ID from the request (using JWT)
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check database connection
    try {
      await db.$connect();
    } catch (dbError) {
      console.error('API: Database connection error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    try {
      // Get user with settings
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

      const settings = user.settings;

      // Determine redirect path based on onboarding progress
      let redirectPath;
      if (!settings || !(settings as any).websiteUrl) {
        redirectPath = '/onboarding/website-url';
      } else if (!(settings as any).businessDescription) {
        redirectPath = '/onboarding/business-description';
      } else if (!(settings as any).competitors || (settings as any).competitors === '[]') {
        redirectPath = '/onboarding/competitors';
      } else if ((settings as any).sitemapUrl === undefined || (settings as any).sitemapUrl === null) {
        redirectPath = '/onboarding/sitemap';
      } else if ((settings as any).hasGoogleSearchConsole === undefined || (settings as any).hasGoogleSearchConsole === null) {
        redirectPath = '/onboarding/google-search-console';
      } else if ((settings as any).targetLanguages === undefined || (settings as any).targetLanguages === null) {
        redirectPath = '/onboarding/target-audience';
      } else {
        redirectPath = '/dashboard';
      }
      
      return NextResponse.json({
        success: true,
        redirectTo: redirectPath,
        onboardingComplete: redirectPath === '/dashboard',
        onboardingStatus: {
          hasWebsiteUrl: !!(settings as any)?.websiteUrl,
          hasBusinessDescription: !!(settings as any)?.businessDescription,
          hasCompetitors: !!((settings as any)?.competitors && (settings as any).competitors !== '[]'),
          hasSitemapUrl: (settings as any)?.sitemapUrl !== undefined && (settings as any)?.sitemapUrl !== null,
          hasGoogleSearchConsole: (settings as any)?.hasGoogleSearchConsole !== undefined && (settings as any)?.hasGoogleSearchConsole !== null,
          hasTargetAudience: (settings as any)?.targetLanguages !== undefined && (settings as any)?.targetLanguages !== null,
        }
      });
    } catch (error: any) {
      console.error('Error checking onboarding status:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Error checking onboarding status',
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