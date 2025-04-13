'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logout } from '@/lib/auth-utils';

export default function LoginRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Clear any authentication cookies to prevent redirect loops
        await logout();
      } catch (error) {
        console.error('Error during logout:', error);
      }
      
      // Get any query parameters
      const returnUrl = searchParams?.get('returnUrl');
      const queryString = returnUrl ? `?returnUrl=${returnUrl}` : '';
      
      // Redirect to the actual login page
      router.replace(`/auth/login${queryString}`);
    };
    
    handleRedirect();
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to login page...</p>
    </div>
  );
} 