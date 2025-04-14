'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserData } from '@/lib/auth-utils';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Array<{domain: string, name?: string}>>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
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
          
          // Pre-fill competitors if they exist
          if (userData.settings && userData.settings.competitors) {
            try {
              // Check if it's already an array or needs to be parsed
              const existingCompetitors = Array.isArray(userData.settings.competitors) 
                ? userData.settings.competitors 
                : JSON.parse(userData.settings.competitors);
              setCompetitors(existingCompetitors);
            } catch (e) {
              console.error('Error parsing competitors:', e);
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

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Send data to the backend
      const response = await fetch('/api/user/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ competitors }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save competitors');
      }

      // Redirect to sitemap page (final step in onboarding)
      router.push('/dashboard/sitemap');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error saving competitors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      const domain = newCompetitor.trim().toLowerCase();
      
      // Check if already exists
      if (competitors.some(c => c.domain.toLowerCase() === domain)) {
        setError('This competitor is already in your list');
        return;
      }
      
      setCompetitors([...competitors, { domain }]);
      setNewCompetitor('');
      setError('');
    }
  };

  const removeCompetitor = (domain: string) => {
    setCompetitors(competitors.filter(c => c.domain !== domain));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };
  
  // Function to determine icon color class based on index
  const getIconColorClass = (index: number) => {
    const colors = ['blue', 'green', 'red', 'purple', 'yellow', 'indigo', 'pink'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Select your competitors</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-orange-50 p-6 text-orange-800">
          <p className="font-semibold">This step is really important. Choose competitors that are popular, relevant, and active in your industry.</p>
          <p className="text-sm">Analyzing your competition helps to:</p>
          <ul className="list-inside list-disc space-y-2 text-sm">
            <li>Find trending topics and content gaps to stay ahead of the competition</li>
            <li>Identify industry keywords to understand the language of your domain</li>
          </ul>
          <p className="text-sm">Find inspiration through competitor analysis</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type competitor domain (e.g. domain.com)"
              className="w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button 
              onClick={addCompetitor} 
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-8">
          {competitors.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No competitors found. Please add competitors manually.
            </div>
          ) : (
            competitors.map((competitor, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-${getIconColorClass(index)}-100 text-${getIconColorClass(index)}-800`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-medium">{competitor.domain}</span>
                <button 
                  onClick={() => removeCompetitor(competitor.domain)}
                  className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className={`rounded-md px-8 py-2 text-sm font-medium text-white ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isLoading ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
} 