'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { setUserData } from '@/lib/auth-utils';
import { signIn, useSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  
  // Check if already authenticated and redirect if needed
  useEffect(() => {
    const checkExistingAuth = async () => {
      // If a login was just attempted, skip this check
      if (loginAttempted) {
        console.log('Login just attempted, skipping initial auth check.');
        return;
      }
      
      // Check if we have a forceLogout parameter, if so go to logout endpoint
      const forceLogout = searchParams?.get('forceLogout');
      if (forceLogout === 'true') {
        console.log('Force logout parameter detected, calling logout endpoint');
        try {
          // Call the logout endpoint
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
          console.log('Forced logout successful');
        } catch (error) {
          console.error('Error during forced logout:', error);
        }
        return;
      }
      
      try {
        // Verify authentication with the backend
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Send cookies with the request
        });
        
        if (response.ok) {
          console.log('User is already authenticated, redirecting to dashboard');
          const returnUrl = searchParams?.get('returnUrl') || '/dashboard';
          router.push(returnUrl);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Continue to login page if verification fails
      }
    };
    
    checkExistingAuth();
  }, [router, searchParams, loginAttempted]);
  
  // Handle NextAuth session changes
  useEffect(() => {
    if (session && session.user) {
      console.log('NextAuth session detected:', session.user.email);
      
      // Store user data if available
      if (session.user) {
        setUserData({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role || 'user'
        });
        
        // For OAuth login, redirect to a handler that will check both onboarding steps
        // This endpoint should check for website URL and business description completion
        const returnUrl = searchParams?.get('returnUrl') || '/auth/check-onboarding';
        console.log('Redirecting to check complete onboarding status:', returnUrl);
        
        // Use a direct location change instead of router.push to avoid Next.js routing issues
        setTimeout(() => {
          console.log('Executing redirect to:', returnUrl);
          window.location.href = returnUrl;
        }, 1500);
      }
    }
  }, [session, router, searchParams]);
  
  // Check for error in URL (from NextAuth)
  useEffect(() => {
    const errorType = searchParams?.get('error');
    if (errorType) {
      switch (errorType) {
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          setError('There was a problem with Google sign in. Please try again.');
          break;
        case 'Callback':
          setError('There was a problem verifying your account. Please try again.');
          break;
        case 'CredentialsSignin':
          setError('Invalid email or password.');
          break;
        default:
          setError('An error occurred during sign in. Please try again.');
          break;
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoginAttempted(true);

    try {
      console.log('Attempting login for:', email);
      
      // Use the local API endpoint for login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with the request
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success && data.data) {
        console.log('Login successful, storing user data');
        
        // Store user data - handling both legacy and new response formats
        const userData = data.data.user || data.data;
        setUserData(userData);
        
        // Check user's onboarding progress
        const hasWebsiteUrl = userData.settings && userData.settings.websiteUrl;
        const hasBusinessDescription = userData.settings && userData.settings.businessDescription;
        const hasCompetitors = userData.settings && userData.settings.competitors && 
                               Array.isArray(userData.settings.competitors) && 
                               userData.settings.competitors.length > 0;
        const hasSitemapUrl = userData.settings && userData.settings.sitemapUrl !== undefined;
        const hasGoogleSearchConsole = userData.settings && userData.settings.hasGoogleSearchConsole !== undefined;
        const hasTargetAudience = userData.settings && userData.settings.targetLanguages !== undefined;
        
        // Determine redirect path based on onboarding progress
        let redirectPath;
        if (!hasWebsiteUrl) {
          // First step: Website URL configuration
          redirectPath = '/onboarding/website-url';
        } else if (!hasBusinessDescription) {
          // Second step: Business description (UI shows as "Step 1")
          redirectPath = '/onboarding/business-description';
        } else if (!hasCompetitors) {
          // Third step: Competitors selection (UI shows as "Step 2")
          redirectPath = '/onboarding/competitors';
        } else if (!hasSitemapUrl) {
          // Fourth step: Sitemap URL (UI shows as "Step 3", optional but always show the page)
          redirectPath = '/onboarding/sitemap';
        } else if (!hasGoogleSearchConsole) {
          // Fifth step: Google Search Console (UI shows as "Step 4", optional but always show the page)
          redirectPath = '/onboarding/google-search-console';
        } else if (!hasTargetAudience) {
          // Sixth step: Target audience (UI shows as "Last Step")
          redirectPath = '/onboarding/target-audience';
        } else {
          // All onboarding complete
          redirectPath = '/dashboard';
        }
        
        const returnUrl = searchParams?.get('returnUrl') || redirectPath;
        
        console.log(`Redirecting to: ${returnUrl} (Onboarding status: ${
          !hasWebsiteUrl ? 'needs website URL' : 
          !hasBusinessDescription ? 'needs business description' : 
          !hasCompetitors ? 'needs competitors' : 
          !hasSitemapUrl ? 'needs sitemap URL' : 
          !hasGoogleSearchConsole ? 'needs Google Search Console' :
          !hasTargetAudience ? 'needs target audience' :
          'completed'
        })`);
        
        // Use a direct location change instead of router.push to avoid Next.js routing issues
        setTimeout(() => {
          console.log('Executing redirect to:', returnUrl);
          window.location.href = returnUrl;
        }, 1500);
      } else {
        setError(data.message || 'Login failed');
        setLoginAttempted(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
      setLoginAttempted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    setLoginAttempted(true);
    
    try {
      // When using Google sign-in, redirect to onboarding check
      const returnUrl = searchParams?.get('returnUrl') || '/auth/check-onboarding';
      console.log('Google sign-in, will redirect to:', returnUrl);
      
      // Call NextAuth signIn with Google provider
      const result = await signIn('google', { 
        callbackUrl: returnUrl,
        redirect: true
      });
      
      console.log('Google sign-in result:', result);
    } catch (err: any) {
      setIsLoading(false);
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign in error:', err);
      setLoginAttempted(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/">
            <Image 
              src="/logo.svg" 
              alt="LamontAI Logo" 
              width={150} 
              height={50} 
              style={{ height: 'auto' }}
              className="cursor-pointer"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.svg';
              }}
            />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/register" className="font-medium text-orange-600 hover:text-orange-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    // Eye icon (hidden)
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    // Eye icon (visible)
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">Sign in with Google</span>
                {/* Google Icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 