import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { getDatabaseClient } from '@/lib/db';
import { getGoogleOAuthTokens } from '@/lib/google';

// Mark this route as dynamic since it uses request parameters and cookies
export const dynamic = 'force-dynamic';

// Define the runtime for clarity
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      console.log("Authorization code missing in callback.");
      return NextResponse.redirect(new URL('/settings/integrations?error=auth_failed', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await getGoogleOAuthTokens({
      code,
      redirectUri: process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI as string,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    });
    
    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      console.error("Failed to obtain Google OAuth tokens:", tokenResponse);
      return NextResponse.redirect(new URL('/settings/integrations?error=token_exchange_failed', request.url));
    }

    // Store tokens securely in the user's settings
    await db.settings.update({
      where: { userId },
      data: {
        hasGoogleSearchConsole: true,
        googleSearchConsoleTokens: JSON.stringify({
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresIn: tokenResponse.expires_in,
          scope: tokenResponse.scope,
          tokenType: tokenResponse.token_type,
          issuedAt: Date.now()
        }),
      },
    });

    // Redirect back to integrations page with success message
    return NextResponse.redirect(new URL('/settings/integrations?success=gsc_connected', request.url));
    
  } catch (error) {
    console.error('Error handling Google Search Console callback:', error);
    // Redirect back to integrations page with generic error
    return NextResponse.redirect(new URL('/settings/integrations?error=callback_failed', request.url));
  }
} 