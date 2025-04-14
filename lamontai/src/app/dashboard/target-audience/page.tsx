'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserData } from '@/lib/auth-utils';

// Define the available languages with their audience sizes
const AVAILABLE_LANGUAGES = [
  { id: 'english', name: 'English', audienceSize: 1500000000, flags: ['us', 'gb', 'ca'] },
  { id: 'spanish', name: 'Spanish', audienceSize: 475000000, flags: ['es', 'mx'] },
  { id: 'french', name: 'French', audienceSize: 330000000, flags: ['fr', 'be'] },
  { id: 'german', name: 'German', audienceSize: 130000000, flags: ['de', 'at'] },
  { id: 'portuguese', name: 'Portuguese', audienceSize: 260000000, flags: ['pt', 'br'] },
  { id: 'italian', name: 'Italian', audienceSize: 85000000, flags: ['it'] },
  { id: 'dutch', name: 'Dutch', audienceSize: 30000000, flags: ['nl'] },
  { id: 'russian', name: 'Russian', audienceSize: 258000000, flags: ['ru'] },
  { id: 'japanese', name: 'Japanese', audienceSize: 128000000, flags: ['jp'] },
  { id: 'chinese', name: 'Chinese', audienceSize: 1120000000, flags: ['cn'] },
];

// Helper to format audience size in millions/billions
const formatAudienceSize = (size: number) => {
  if (size >= 1000000000) {
    return (size / 1000000000).toFixed(1) + 'B';
  }
  return (size / 1000000).toFixed(0) + 'M';
};

export default function TargetAudiencePage() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
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
          if (userData.settings && userData.settings.targetLanguages) {
            try {
              const langArray = Array.isArray(userData.settings.targetLanguages) 
                ? userData.settings.targetLanguages 
                : JSON.parse(userData.settings.targetLanguages);
              setSelectedLanguages(langArray);
            } catch (e) {
              console.error('Error parsing target languages:', e);
              setSelectedLanguages([]);
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

    // Validate at least one language is selected
    if (selectedLanguages.length === 0) {
      setError('Please select at least one target language');
      setIsLoading(false);
      return;
    }

    try {
      // Calculate total audience size
      const totalAudienceSize = selectedLanguages.reduce((total, langId) => {
        const language = AVAILABLE_LANGUAGES.find(l => l.id === langId);
        return total + (language?.audienceSize || 0);
      }, 0);

      // Send data to the backend
      const response = await fetch('/api/user/target-audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          targetLanguages: selectedLanguages,
          audienceSize: totalAudienceSize
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save target audience');
      }

      // Redirect to dashboard as this is the last step
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error saving target audience:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = (langId: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langId)) {
        return prev.filter(id => id !== langId);
      } else {
        return [...prev, langId];
      }
    });
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

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="bg-orange-100 text-orange-700 w-fit px-4 py-1 rounded-full text-sm font-medium mb-4">
            Last Step
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Select your target audience
          </h1>
          
          <p className="text-gray-600 mb-6">
            Select the languages based on your target audience
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {AVAILABLE_LANGUAGES.map(language => (
              <div 
                key={language.id}
                onClick={() => toggleLanguage(language.id)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${selectedLanguages.includes(language.id) 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex space-x-1 mr-3">
                      {language.flags.map(flag => (
                        <span key={flag} className="text-xl">
                          {flag === 'us' && '🇺🇸'}
                          {flag === 'gb' && '🇬🇧'}
                          {flag === 'ca' && '🇨🇦'}
                          {flag === 'es' && '🇪🇸'}
                          {flag === 'mx' && '🇲🇽'}
                          {flag === 'fr' && '🇫🇷'}
                          {flag === 'be' && '🇧🇪'}
                          {flag === 'de' && '🇩🇪'}
                          {flag === 'at' && '🇦🇹'}
                          {flag === 'pt' && '🇵🇹'}
                          {flag === 'br' && '🇧🇷'}
                          {flag === 'it' && '🇮🇹'}
                          {flag === 'nl' && '🇳🇱'}
                          {flag === 'ru' && '🇷🇺'}
                          {flag === 'jp' && '🇯🇵'}
                          {flag === 'cn' && '🇨🇳'}
                        </span>
                      ))}
                    </div>
                    <span className="font-medium">{language.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Audience: {formatAudienceSize(language.audienceSize)}
                  </div>
                </div>
                
                {/* Checkbox indicator */}
                <div className="flex justify-end mt-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    selectedLanguages.includes(language.id) 
                      ? 'bg-orange-500' 
                      : 'border border-gray-300'
                  }`}>
                    {selectedLanguages.includes(language.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-3 rounded-full ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600'
              } text-white font-medium`}
            >
              {isLoading ? 'Processing...' : 'Complete Setup'}
            </button>
          </div>

          {/* Selected languages summary */}
          {selectedLanguages.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700 mb-2">Your selected languages:</p>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map(langId => {
                  const lang = AVAILABLE_LANGUAGES.find(l => l.id === langId);
                  return lang ? (
                    <span key={langId} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                      {lang.name}
                    </span>
                  ) : null;
                })}
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Total potential audience: {formatAudienceSize(
                  selectedLanguages.reduce((total, langId) => {
                    const language = AVAILABLE_LANGUAGES.find(l => l.id === langId);
                    return total + (language?.audienceSize || 0);
                  }, 0)
                )}
              </p>
            </div>
          )}
        </form>

        {/* World map visualization could go here */}
        <div className="mt-8 w-full max-w-2xl mx-auto">
          <Image
            src="/world-map.svg"
            alt="World Map"
            width={800}
            height={400}
            className="w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.svg';
            }}
          />
        </div>
      </main>
    </div>
  );
} 