/**
 * Utilities for interacting with Google APIs, specifically OAuth 2.0 flow.
 * Designed to be edge-compatible.
 */

interface GoogleOAuthTokenParams {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Based on Google OAuth 2.0 documentation
interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number; // Typically 3599 (1 hour)
  refresh_token?: string; // Only present if access_type=offline was used and it's the first exchange
  scope: string;
  token_type: string; // Typically "Bearer"
  id_token?: string; // If openid scope was requested
}

interface GoogleOAuthErrorResponse {
    error: string;
    error_description?: string;
}

// Define input interface
interface GoogleOAuthTokensInput {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Define output interface based on Google's token response
interface GoogleOAuthTokensResponse {
  access_token: string;
  expires_in: number; // Duration in seconds
  refresh_token?: string; // Optional: Not always returned, depends on scope and consent
  scope: string;
  token_type: string; // Usually "Bearer"
  id_token?: string; // Optional: If 'openid' scope was requested
}

// Google's token endpoint URL
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Exchanges an authorization code for Google OAuth tokens.
 * Designed to be Edge Runtime compatible.
 * @param {GoogleOAuthTokensInput} params - The required parameters for the token exchange.
 * @returns {Promise<GoogleOAuthTokensResponse>} A promise that resolves with the Google OAuth tokens.
 * @throws {Error} If the token exchange fails due to network issues or an error response from Google.
 */
export async function getGoogleOAuthTokens({
  code,
  clientId,
  clientSecret,
  redirectUri,
}: GoogleOAuthTokensInput): Promise<GoogleOAuthTokensResponse> {
  // Construct the request body using URLSearchParams
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('redirect_uri', redirectUri);
  params.append('grant_type', 'authorization_code');

  try {
    // Make the POST request using fetch
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(), // Convert params to string for the body
    });

    // Attempt to parse the response body as JSON regardless of status,
    // as Google often includes error details in the JSON body.
    const data = await response.json();

    // Check if the request was successful (status code 2xx)
    if (!response.ok) {
      // Log the error details from Google's response
      console.error('Google OAuth Token Exchange Error:', {
          status: response.status,
          statusText: response.statusText,
          body: data
      });
      // Throw a more informative error
      throw new Error(`Failed to fetch Google OAuth tokens. Status: ${response.status} ${response.statusText}. Response: ${JSON.stringify(data)}`);
    }

    // Basic validation of the successful response structure
    if (!data.access_token || typeof data.expires_in !== 'number' || !data.token_type) {
         console.error('Google OAuth Response Missing Essential Fields:', data);
         throw new Error('Incomplete token data received from Google. Essential fields (access_token, expires_in, token_type) missing.');
    }

    // Return the parsed token data, cast to the defined interface
    return data as GoogleOAuthTokensResponse;

  } catch (error) {
    // Catch potential network errors from fetch or errors thrown above
    console.error('Error during Google OAuth token exchange:', error);
    // Re-throw the error to be handled by the caller
    if (error instanceof Error) {
        // Append context if it's a generic error
        if (!error.message.startsWith('Failed to fetch Google OAuth tokens')) {
             throw new Error(`Network or processing error during Google OAuth token exchange: ${error.message}`);
        } else {
            throw error; // Re-throw the specific error from the try block
        }
    }
    // Handle non-Error objects being thrown (less common)
    throw new Error('An unknown error occurred during the Google OAuth token exchange.');
  }
} 