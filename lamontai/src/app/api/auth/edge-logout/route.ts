/**
 * Edge-compatible logout API endpoint
 * This API route handles user logout in the Edge runtime
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Specify Edge runtime
export const runtime = 'edge';

// Use dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST handler for user logout
 */
export async function POST(request: NextRequest) {
  try {
    // Clear auth cookie
    cookies().delete('auth_token');
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Logged out successfully' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in edge logout API:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 