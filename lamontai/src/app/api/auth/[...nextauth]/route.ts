// Use a dynamic import to support both NodeJS and Edge Runtime builds
// This file is specifically for Node.js environment while auth-cloudflare/route.ts handles Cloudflare

// When building for Cloudflare, this will be skipped for page generation
// Properly configured as a NodeJS build only
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to prevent build errors
export async function GET(req: NextRequest, context: { params: { nextauth: string[] } }) {
  try {
    // Load NextAuth dynamically
    const NextAuth = (await import('next-auth')).default;
    const { authOptions } = await import('@/lib/auth-config');
    
    const handler = NextAuth(authOptions);
    return handler.GET(req, context);
  } catch (error) {
    console.error('NextAuth GET error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: { params: { nextauth: string[] } }) {
  try {
    // Load NextAuth dynamically
    const NextAuth = (await import('next-auth')).default;
    const { authOptions } = await import('@/lib/auth-config');
    
    const handler = NextAuth(authOptions);
    return handler.POST(req, context);
  } catch (error) {
    console.error('NextAuth POST error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
} 