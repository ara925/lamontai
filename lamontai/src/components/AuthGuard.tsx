'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api-client';
import { isAuthenticated as checkIsAuthenticated } from '@/lib/auth-utils';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component to protect routes from unauthenticated access
 * Redirects to login if user is not authenticated
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckAttempts = useRef<number>(0);
  const MAX_AUTH_ATTEMPTS = 3;
  const lastAuthAttemptTime = useRef<number>(0);
  const MIN_AUTH_RETRY_INTERVAL = 2000; // 2 seconds between retries

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/privacy',
    '/terms',
    '/pricing',
  ];

  useEffect(() => {
    // Clear any existing timeouts when dependencies change
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }

    const checkAuth = async () => {
      // Skip auth check for public routes
      if (publicRoutes.includes(pathname || '')) {
        setIsAuthenticated(true);
        return;
      }

      try {
        // Prevent API call flooding
        const now = Date.now();
        if (now - lastAuthAttemptTime.current < MIN_AUTH_RETRY_INTERVAL) {
          // If we're calling too frequently, delay the check
          authCheckTimeoutRef.current = setTimeout(checkAuth, MIN_AUTH_RETRY_INTERVAL);
          return;
        }
        
        lastAuthAttemptTime.current = now;
        authCheckAttempts.current += 1;
        
        // Only verify with API if we haven't exceeded max attempts
        if (authCheckAttempts.current <= MAX_AUTH_ATTEMPTS) {
          // Verify token is valid by checking user data with the backend
          const response = await api.auth.me();
          if (response.data?.success && response.data?.data) {
            authCheckAttempts.current = 0; // Reset counter on success
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid user data');
          }
        }
      } catch (error: any) {
        console.error('Authentication error:', error);
        
        // Handle 500 server errors - don't continue retrying if we hit this multiple times
        if (error.response && error.response.status === 500) {
          if (authCheckAttempts.current >= 2) {
            console.error('Multiple API errors (500), redirecting to login');
            setIsAuthenticated(false);
            const returnUrl = encodeURIComponent(pathname || '/dashboard');
            router.push(`/auth/login?returnUrl=${returnUrl}&forceLogout=true`);
            return;
          } else {
            // First 500 error - maintain current session
            console.warn('Server error (500), maintaining current session');
            setIsAuthenticated(true);
            return;
          }
        }
        
        // Handle network errors (when API server is down)
        if (error.code === 'ERR_NETWORK') {
          console.warn('Network error, maintaining current session');
          setIsAuthenticated(true);
          return;
        }
        
        // Handle 400 Bad Request for expired/invalid tokens
        if (error.response && error.response.status === 400) {
          console.warn('Bad request (400), possibly invalid token');
          // Only redirect if we've tried multiple times
          if (authCheckAttempts.current >= 2) {
            setIsAuthenticated(false);
            const returnUrl = encodeURIComponent(pathname || '/dashboard');
            router.push(`/auth/login?returnUrl=${returnUrl}&forceLogout=true`);
          } else {
            // First attempt with 400 - maintain current session
            setIsAuthenticated(true);
          }
          return;
        }
        
        // Only redirect on auth-related failures
        if (
          error.message === 'No token found' || 
          error.message === 'Invalid user data' ||
          error.message === 'Token is invalid or expired' ||
          (error.response && (error.response.status === 401 || error.response.status === 403))
        ) {
          // Redirect to login
          setIsAuthenticated(false);
          const returnUrl = encodeURIComponent(pathname || '/dashboard');
          router.push(`/auth/login?returnUrl=${returnUrl}&forceLogout=true`);
        } else {
          // For other errors, maintain current session
          console.warn('API error, maintaining current session');
          setIsAuthenticated(true);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [pathname, router, publicRoutes]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Render children when authenticated or on public routes
  return <>{children}</>;
};

export default AuthGuard; 