'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getUserData, 
  isAuthenticated,
  setUserData,
  logout
} from '@/lib/auth-utils';

// Define a type for the auth state
interface AuthState {
  isAuthenticated: boolean;
  userData: any;
  cookieExists: boolean;
}

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userData: null,
    cookieExists: false
  });
  
  // Function to refresh auth state
  const refreshAuthState = async () => {
    try {
      const authenticated = await isAuthenticated();
      const userData = await getUserData();
      const cookieExists = document.cookie.includes('token');
      
      setAuthState({
        isAuthenticated: authenticated,
        userData,
        cookieExists
      });
      
      // Also log to console for inspection
      console.log('Auth Debug - isAuthenticated:', authenticated);
      console.log('Auth Debug - User Data:', userData);
      console.log('Auth Debug - Cookie exists:', cookieExists);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };
  
  // Run on mount and when dependencies change
  useEffect(() => {
    refreshAuthState();
  }, []);
  
  // Function to clear authentication
  const handleClearAuth = async () => {
    try {
      await logout();
      refreshAuthState();
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };
  
  // Function to set test user data (note: can't set token directly anymore)
  const handleSetTestData = () => {
    // Set user data in session storage
    setUserData({
      id: '1234567890',
      name: 'Test User',
      email: 'test@example.com'
    });
    
    refreshAuthState();
  };
  
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication Debugging</h1>
      
      <div className="mb-8">
        <div className="flex space-x-4 mb-4">
          <button 
            onClick={refreshAuthState}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh State
          </button>
          <button 
            onClick={handleClearAuth}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Auth
          </button>
          <button 
            onClick={handleSetTestData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Set Test User Data
          </button>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Current State</h2>
            <div className="space-y-2">
              <p><strong>Is Authenticated:</strong> {authState.isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Token Cookie Exists:</strong> {authState.cookieExists ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">User Data</h2>
            <div className="space-y-2">
              <pre className="p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(authState.userData, null, 2) || 'No user data found'}
              </pre>
            </div>
          </div>
          
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Navigation</h2>
            <div className="space-y-2">
              <ul className="space-y-2">
                <li><Link href="/test" className="text-blue-500 hover:underline">Test Home</Link></li>
                <li><Link href="/dashboard" className="text-blue-500 hover:underline">Dashboard</Link></li>
                <li><Link href="/dashboard/settings" className="text-blue-500 hover:underline">Settings</Link></li>
                <li><Link href="/auth/login" className="text-blue-500 hover:underline">Login</Link></li>
                <li><Link href="/auth/register" className="text-blue-500 hover:underline">Register</Link></li>
                <li><Link href="/" className="text-blue-500 hover:underline">Home</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Cookies</h2>
        <div id="cookie-display" className="p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
          <pre>{document.cookie}</pre>
        </div>
        <button 
          onClick={() => document.getElementById('cookie-display')!.innerHTML = `<pre>${document.cookie}</pre>`}
          className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Refresh Cookies
        </button>
      </div>
    </div>
  );
} 