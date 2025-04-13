import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/server-auth-utils';

// Enable middleware for all routes except static files, API auth routes, and test routes
export const config = {
  matcher: [
    // Match all routes except static files, API auth routes, and test routes
    '/((?!_next/static|_next/image|favicon.ico|api/auth|test).*)',
  ],
  // runtime: 'nodejs' // Remove runtime config, default to Edge
};

// Middleware must be async now because verifyToken is async
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/auth/login' || 
    path === '/auth/register' || 
    path === '/auth/signup' ||  // Add explicit signup path
    path === '/auth/forgot-password' || 
    path === '/' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/_next') ||
    path.startsWith('/test') ||
    path.includes('.svg') ||
    path.includes('.png') ||
    path.includes('favicon.ico');

  // Get the token from the cookies
  const token = request.cookies.get('token')?.value || '';
  
  // Try to get from authorization header (for API calls)
  const authHeader = request.headers.get('Authorization');
  const headerToken = authHeader ? authHeader.replace('Bearer ', '') : '';
  
  // Create a new explicit header from the cookie token
  // This is a workaround for Docker containerization where cookies may not be properly transferred
  const finalToken = token || headerToken;
  
  // Bypass protection for test routes
  if (path.startsWith('/test')) {
    return NextResponse.next();
  }
  
  // Always allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, check for a token
  if (!finalToken) {
    // Create URL to redirect to
    const url = new URL('/auth/login', request.url);
    // Set a redirectTo parameter to redirect back after login
    url.searchParams.set('returnUrl', path);
    
    // Create a response that redirects
    return NextResponse.redirect(url);
  }

  // Token exists, let's verify it
  try {
    // Try to verify the token
    const payload = await verifyToken(finalToken);
    
    if (!payload) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('returnUrl', path);
      return NextResponse.redirect(url);
    }
    
    // If we're trying to go to login but we're already authenticated, redirect to dashboard
    if (path === '/auth/login' || path === '/auth/register' || path === '/auth/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Add user info to headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role || 'user');
    
    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // If we're already on the login page with a returnUrl, don't redirect again
    // This prevents redirect loops
    if (path === '/auth/login' && request.nextUrl.searchParams.has('returnUrl')) {
      return NextResponse.next();
    }
    
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('returnUrl', path);
    return NextResponse.redirect(url);
  }
} 