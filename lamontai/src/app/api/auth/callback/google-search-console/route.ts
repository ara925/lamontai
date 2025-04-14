import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code and state from the URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      return new Response(
        `<html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: false, 
                  error: '${error}' 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication error. This window will close automatically.</p>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if the authorization code is present
    if (!code) {
      return new Response(
        `<html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: false, 
                  error: 'No authorization code received' 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication error: No authorization code received. This window will close automatically.</p>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Exchange the code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google-search-console`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Token exchange error:', tokenError);
      
      return new Response(
        `<html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: false, 
                  error: 'Failed to exchange code for tokens' 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication error: Failed to exchange code for tokens. This window will close automatically.</p>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // Get user ID from cookies or session
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return new Response(
        `<html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: false, 
                  error: 'User not authenticated' 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication error: User not authenticated. This window will close automatically.</p>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    
    // Store token data in the database
    // First, check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    
    if (!user) {
      return new Response(
        `<html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: false, 
                  error: 'User not found' 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication error: User not found. This window will close automatically.</p>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    
    // Store tokens and update hasGoogleSearchConsole flag
    const googleTokenData = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
    
    // Securely store token data
    try {
      // If user has settings, update them
      if (user.settings) {
        await db.settings.update({
          where: { userId },
          data: {
            hasGoogleSearchConsole: true,
            // Store tokens in a secure way, preferably encrypted
            // This is just an example, in production you'd want to encrypt these tokens
            googleSearchConsoleTokens: JSON.stringify(googleTokenData),
          } as any,
        });
      } else {
        // Create settings if they don't exist
        await db.settings.create({
          data: {
            userId,
            hasGoogleSearchConsole: true,
            // Store tokens in a secure way, preferably encrypted
            googleSearchConsoleTokens: JSON.stringify(googleTokenData),
          } as any,
        });
      }
      
      // Return success HTML with JavaScript to close the window and notify the opener
      return new Response(
        `<html>
          <head>
            <title>Google Search Console Connected</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: true 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 100px;">
              <h2>Successfully connected to Google Search Console</h2>
              <p>You can close this window now.</p>
            </div>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      return new Response(
        `<html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                  success: false, 
                  error: 'Database error when storing tokens' 
                }, 
                window.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication error: Database error when storing tokens. This window will close automatically.</p>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
  } catch (error) {
    console.error('Google Search Console OAuth callback error:', error);
    
    return new Response(
      `<html>
        <head>
          <title>Authentication Error</title>
          <script>
            window.opener.postMessage(
              { 
                type: 'GOOGLE_SEARCH_CONSOLE_AUTH', 
                success: false, 
                error: 'Server error processing authentication' 
              }, 
              window.location.origin
            );
            window.close();
          </script>
        </head>
        <body>
          <p>Authentication error: Server error processing authentication. This window will close automatically.</p>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
} 