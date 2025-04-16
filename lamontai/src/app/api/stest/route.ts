// Ensure this route is always rendered dynamically
export const dynamic = 'force-dynamic';

// Set the runtime to Edge
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the hostname - useful for debugging
    const hostname = request.headers.get('host') || 'unknown';
    
    // Get environment info
    const environment = process.env.NODE_ENV || 'unknown';
    const dbId = process.env.CLOUDFLARE_DB_ID || 'not set';
    const hasDbUrl = !!process.env.DATABASE_URL ? 'yes' : 'no';
    
    // Get Cloudflare-specific headers if available
    const cfHeaders: Record<string, string> = {};
    for (const [key, value] of request.headers.entries()) {
      if (key.startsWith('cf-')) {
        cfHeaders[key] = value;
      }
    }
    
    // Test if we're running in a Cloudflare environment
    const isCloudflare = 'cf-ray' in cfHeaders ? 'yes' : 'no';
    
    // Create response object
    const response = {
      message: 'Edge API test endpoint is working',
      time: new Date().toISOString(),
      environment,
      hostname,
      runtime: 'edge',
      database: {
        hasConnectionString: hasDbUrl,
        cloudflareDbId: dbId
      },
      cloudflare: {
        isCloudflareEnvironment: isCloudflare,
        headers: cfHeaders
      }
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Edge API test error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      time: new Date().toISOString()
    }, { status: 500 });
  }
} 