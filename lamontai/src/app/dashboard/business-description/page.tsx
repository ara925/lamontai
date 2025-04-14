'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserData } from '@/lib/auth-utils';

export default function BusinessDescriptionPage() {
  const [businessDescription, setBusinessDescription] = useState('');
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [newAudience, setNewAudience] = useState('');
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
          if (userData.settings) {
            if (userData.settings.businessDescription) {
              setBusinessDescription(userData.settings.businessDescription);
            }
            if (userData.settings.targetAudiences) {
              try {
                // Check if it's already an array or needs to be parsed
                const audiences = Array.isArray(userData.settings.targetAudiences)
                  ? userData.settings.targetAudiences
                  : JSON.parse(userData.settings.targetAudiences);
                setTargetAudiences(audiences);
              } catch (e) {
                console.error('Error parsing target audiences:', e);
              }
            }
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

    // Basic validation
    if (!businessDescription.trim()) {
      setError('Please enter a business description');
      setIsLoading(false);
      return;
    }

    if (businessDescription.length < 10) {
      setError('Business description must be at least 10 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Send data to the backend
      const response = await fetch('/api/user/business-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          businessDescription,
          targetAudiences
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save business description');
      }

      // Redirect to competitors page
      router.push('/dashboard/competitors');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error saving business description:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTargetAudience = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAudience.trim() && !targetAudiences.includes(newAudience.trim())) {
      setTargetAudiences([...targetAudiences, newAudience.trim()]);
      setNewAudience('');
    }
  };

  const removeTargetAudience = (audience: string) => {
    setTargetAudiences(targetAudiences.filter(a => a !== audience));
  };

  const handleGenerateDescription = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Check if website URL exists
      if (!user?.settings?.websiteUrl) {
        setError('Please set your website URL first');
        setIsLoading(false);
        return;
      }
      
      // AI-generated description would go here
      // This is a placeholder for the actual API call
      setBusinessDescription('The website appears to serve as a platform for generating professional written content tailored to various business needs. With a focus on delivering perfectly crafted articles, this service aims to provide a seamless experience for users looking for quality content without the hassle of writing it themselves.');
      
      // Set some default target audiences as an example
      if (targetAudiences.length === 0) {
        setTargetAudiences(['Small business owners', 'Marketing professionals', 'Content marketers', 'Startups']);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate description. Please try again.');
      console.error('Error generating description:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header is handled by onboarding layout */}
      <main className="container mx-auto px-6 py-12 flex flex-col md:flex-row">
        {/* Left section with form */}
        <div className="md:w-1/2 md:pr-12">
          <div className="mb-8">
            <div className="bg-orange-100 text-orange-700 w-fit px-4 py-1 rounded-full text-sm font-medium mb-4">
              Step 1
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Describe Your Business
            </h1>
            
            <p className="text-gray-600 mb-4">
              Help us understand your business and target audience to create tailored content
            </p>
            
            <button
              onClick={handleGenerateDescription}
              disabled={isLoading}
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Generate Description with AI
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mb-8">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Enter a description of your business"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[200px]"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Target Audiences (min 2)
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="Type Target Audience and press enter"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={addTargetAudience}
                  className="bg-gray-100 px-4 py-2 rounded-r-full border border-gray-300 border-l-0 hover:bg-gray-200"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {targetAudiences.map((audience, index) => (
                  <div key={index} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                    {audience}
                    <button
                      type="button"
                      onClick={() => removeTargetAudience(audience)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
    </div>
  );
} 