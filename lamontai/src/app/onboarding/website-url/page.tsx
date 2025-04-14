'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserData } from '@/lib/auth-utils';

export default function WebsiteUrlConfirmation() {
  const [websiteUrl, setWebsiteUrl] = useState('');
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

    // Basic URL validation
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      setIsLoading(false);
      return;
    }

    // URL format validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(websiteUrl)) {
      setError('Please enter a valid website URL');
      setIsLoading(false);
      return;
    }

    try {
      // Format URL properly
      let formattedUrl = websiteUrl;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      // Send website URL to the backend
      const response = await fetch('/api/user/website-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ websiteUrl: formattedUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save website URL');
      }

      // Redirect to business description page (actual step 2, labeled as "Step 1" in UI)
      router.push('/dashboard/business-description');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error saving website URL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-6 py-12 flex flex-col md:flex-row">
      {/* Left section with form */}
      <div className="md:w-1/2 md:pr-12">
        <div className="mb-8">
          <div className="bg-orange-100 text-orange-700 w-fit px-4 py-1 rounded-full text-sm font-medium mb-4">
            Lets begin
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Start by Confirming Your Website URL
          </h1>
          
          <p className="text-gray-600">
            Enter the URL for which you would like to rank higher on Google
          </p>
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
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Insert your website URL (domain.com)"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full md:w-auto px-8 py-3 rounded-full ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            } text-white font-medium`}
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </form>
      </div>
      
      {/* Right section with world map graphic */}
      <div className="md:w-1/2 flex items-center justify-center">
        <div className="w-full h-auto max-w-lg">
          <Image
            src="/world-map-dots.svg"
            alt="World Map"
            width={600}
            height={400}
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
  );
} 