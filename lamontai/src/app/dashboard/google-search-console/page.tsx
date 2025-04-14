'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserData } from '@/lib/auth-utils';
import { connectGoogleSearchConsole } from '@/lib/articles';

export default function GoogleSearchConsolePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          setUser(userData);
          
          // Check if user already has GSC connected
          if (userData.settings && userData.settings.hasGoogleSearchConsole) {
            setIsConnected(true);
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/auth/login');
      }
    };

    fetchUserData();
  }, [router]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Initiate Google OAuth flow
      const result = await connectGoogleSearchConsole();
      
      if (result.success) {
        // Update user settings with GSC connection
        const response = await fetch('/api/user/google-search-console', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ connected: true }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to save Google Search Console connection');
        }

        setIsConnected(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to connect to Google Search Console');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error connecting to Google Search Console:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Skip this step since it's optional
  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with logo and logout */}
      <header className="py-4 px-6 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/logo.svg" 
              alt="LamontAI Logo" 
              width={180} 
              height={40}
              priority
            />
          </div>
          <button 
            onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' })
                .then(() => router.push('/auth/login'))
                .catch(err => console.error('Logout error:', err));
            }}
            className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-md text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 flex flex-col md:flex-row">
        {/* Left section with form */}
        <div className="md:w-1/2 md:pr-12">
          <div className="mb-8">
            <div className="bg-orange-100 text-orange-700 w-fit px-4 py-1 rounded-full text-sm font-medium mb-4">
              Step 4
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Google Search Console
              <span className="ml-2 text-lg font-normal text-gray-500">(Optional)</span>
            </h1>
            
            <p className="text-gray-600 mb-4">
              This helps us understand what kind of content to produce.
            </p>
            
            <div className="bg-orange-50 text-orange-800 border-l-4 border-orange-500 p-4 rounded-r mb-6">
              <ul className="list-disc list-inside space-y-1">
                <li>GSC provides vital data that enables us to deliver personalized, SEO-optimized content</li>
                <li>GSC data that helps us identify content gaps and search optimization opportunities</li>
                <li>We only need read-only access to your search data</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {isConnected ? (
            <div className="mb-8 bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Successfully connected to Google Search Console. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={`flex items-center px-8 py-3 rounded-full ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white font-medium`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                    </svg>
                    Connect with Google
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            We only request read-only access to your Google Search Console data. Your data is secure and encrypted, and we adhere to strict privacy protocols. View our <a href="/privacy" className="text-orange-600 hover:text-orange-500 underline">Privacy Policy</a> for more details.
          </p>
        </div>
        
        {/* Right section with graphic */}
        <div className="md:w-1/2 flex items-center justify-center">
          <div className="w-full h-auto max-w-lg">
            <Image
              src="/google-search-console.svg"
              alt="Google Search Console Integration"
              width={400}
              height={300}
              className="w-full h-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Fallback to a simpler image if SVG fails to load
                target.src = '/placeholder-image.svg';
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 