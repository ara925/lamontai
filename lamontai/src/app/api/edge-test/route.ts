/**
 * Edge-compatible test API endpoint
 * This route demonstrates a complete Edge-compatible API with:
 * - Authentication via edge-compatible JWT
 * - Database access via Neon PostgreSQL
 * - Edge-specific headers and response handling
 */

import { NextRequest } from 'next/server';
import { verifyJWTEdge, getTokenFromRequestEdge } from '@/lib/auth-utils-edge';
import { getPrismaForEnvironment } from '@/lib/prisma-cloudflare';

// Specify Edge runtime
export const runtime = 'edge';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET handler for edge test
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Get the correct Prisma client for the environment (edge in this case)
  // Initialize outside try block to potentially use in finally if needed
  const prisma = getPrismaForEnvironment();
  
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const skipAuth = searchParams.get('skipAuth') === 'true';
    
    // Response data to populate
    let responseData: any = {
      message: 'Edge API is functioning correctly',
      runtime: 'edge',
      timestamp: new Date().toISOString(),
      requestHeaders: Object.fromEntries(request.headers.entries()),
    };
    
    // 1. Authentication check (when not skipped)
    if (!skipAuth) {
      const token = getTokenFromRequestEdge(request);
      if (!token) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication required',
            info: 'Add ?skipAuth=true to bypass authentication'
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const payload = await verifyJWTEdge(token);
      if (!payload) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid token',
            info: 'Add ?skipAuth=true to bypass authentication'
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      responseData.auth = {
        authenticated: true,
        user: payload
      };
    } else {
      responseData.auth = {
        authenticated: false,
        skipped: true
      };
    }
    
    // 2. Database access test
    const skipDb = searchParams.get('skipDb') === 'true';
    
    if (!skipDb) {
      try {
        // Use the already initialized prisma client
        // const prisma = await getNeonPrismaClient(); // Remove this line
        
        // Get user count (lightweight query)
        const userCount = await prisma.user.count();
        
        responseData.database = {
          connected: true,
          userCount: userCount,
        };
      } catch (dbError) {
        responseData.database = {
          connected: false,
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          info: 'Add ?skipDb=true to bypass database check'
        };
      }
      // No finally block needed here as $disconnect is not used with Accelerate
    } else {
      responseData.database = {
        connected: false,
        skipped: true
      };
    }
    
    // 3. Web Crypto API test (Edge-specific)
    try {
      const testData = new TextEncoder().encode('edge-runtime-test');
      const hashBuffer = await crypto.subtle.digest('SHA-256', testData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      responseData.webCrypto = {
        available: true,
        testHash: hashHex
      };
    } catch (cryptoError) {
      responseData.webCrypto = {
        available: false,
        error: cryptoError instanceof Error ? cryptoError.message : 'Unknown crypto error'
      };
    }
    
    // 4. Runtime environment information
    responseData.environment = {
      deployEnv: process.env.NEXT_PUBLIC_DEPLOY_ENV || 'unknown',
      cloudflareEnabled: process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === 'true'
    };
    
    // Add processing time
    responseData.processingTime = `${Date.now() - startTime}ms`;
    
    // Return success response
    return new Response(
      JSON.stringify(responseData, null, 2),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Edge-Runtime': 'true'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Edge API error',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${Date.now() - startTime}ms`
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 