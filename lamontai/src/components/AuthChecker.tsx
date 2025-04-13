'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth-utils';

interface AuthCheckerProps {
  children: React.ReactNode;
}

export default function AuthChecker({ children }: AuthCheckerProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        console.log('AuthChecker: Verifying authentication...');
        
        const authenticated = await isAuthenticated();
        console.log('AuthChecker: Authentication result:', authenticated);
        
        if (!authenticated) {
          console.log('AuthChecker: User not authenticated, redirecting to login');
          // Redirect to login with current path as return URL
          const currentPath = window.location.pathname;
          router.push(`/auth/login?returnUrl=${encodeURIComponent(currentPath)}`);
          setAuthError('Not authenticated');
        } else {
          console.log('AuthChecker: User is authenticated, showing protected content');
          setAuthError(null);
        }
      } catch (error) {
        console.error('AuthChecker: Error during authentication check:', error);
        setAuthError('Error during authentication check');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // While checking auth, show a loading indicator
  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If there was an auth error, show error state
  if (authError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-500 font-semibold">Authentication Error</p>
          <p className="mt-2 text-gray-600">{authError}</p>
          <button 
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            onClick={() => router.push('/auth/login')}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  // After checking, render children (the layout will only be shown to authenticated users)
  return <>{children}</>;
} 