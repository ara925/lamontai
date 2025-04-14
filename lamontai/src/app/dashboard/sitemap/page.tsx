'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserData } from '@/lib/auth-utils';

export default function SitemapPage() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          setUser(userData);
          
          // Pre-fill form if user already has settings
          if (userData.settings && userData.settings.sitemapUrl) {
            setSitemapUrl(userData.settings.sitemapUrl);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic URL validation if provided (since it's optional)
    if (sitemapUrl && !isValidUrl(sitemapUrl)) {
      setError('Please enter a valid URL');
      setIsLoading(false);
      return;
    }

    try {
      // Send data to the backend
      const response = await fetch('/api/user/sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sitemapUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save sitemap URL');
      }

      // Redirect to Google Search Console page (next step in onboarding)
      router.push('/dashboard/google-search-console');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error saving sitemap URL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip this step since it's optional
  const handleSkip = () => {
    router.push('/dashboard/google-search-console');
  };

  // Simple URL validation
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
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
              Step 3
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Input your Sitemap URL
              <span className="ml-2 text-lg font-normal text-gray-500">(Optional)</span>
            </h1>
            
            <div className="bg-orange-50 text-orange-800 border-l-4 border-orange-500 p-4 rounded-r mb-6">
              <ul className="list-disc list-inside space-y-1">
                <li>Sitemap helps us add relevant internal links to articles</li>
                <li>Sitemap helps us analyze your previous articles to match your writing style</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mb-8">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <input
                type="text"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="https://lamontai.ai/sitemap.xml"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 rounded-full ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white font-medium`}
              >
                {isLoading ? 'Processing...' : 'Continue'}
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
          </form>
        </div>
        
        {/* Right section with graphic */}
        <div className="md:w-1/2 flex items-center justify-center">
          <div className="w-full h-auto max-w-lg">
            <Image
              src="/sitemap-illustration.svg"
              alt="Sitemap Illustration"
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