'use client';

import React, { useState, useEffect } from 'react';
import { getUserData } from '@/lib/auth-utils';

interface UserData {
  name: string;
  email: string;
  apiKey: string;
  preferences: {
    notifications: boolean;
    theme: string;
    language: string;
  };
  [key: string]: any;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData>({
    name: '',
    email: '',
    apiKey: 'sk_test_123456789abcdefghijk',
    preferences: {
      notifications: true,
      theme: 'light',
      language: 'english',
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          setUser(prev => ({
            ...prev,
            name: userData.name || prev.name,
            email: userData.email || prev.email,
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setNotification({
        type: 'success',
        message: 'Settings saved successfully!'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    }, 1000);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., preferences.theme)
      const [parent, child] = name.split('.');
      setUser(prev => {
        const updatedUser = { ...prev };
        if (updatedUser[parent] && typeof updatedUser[parent] === 'object') {
          updatedUser[parent] = { 
            ...(updatedUser[parent] as object), 
            [child]: type === 'checkbox' ? checked : value 
          };
        }
        return updatedUser;
      });
    } else {
      // Handle top-level properties
      setUser(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setUser(prev => {
        const updatedUser = { ...prev };
        if (updatedUser[parent] && typeof updatedUser[parent] === 'object') {
          updatedUser[parent] = { 
            ...(updatedUser[parent] as object), 
            [child]: value 
          };
        }
        return updatedUser;
      });
    } else {
      // Handle top-level properties
      setUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {notification && (
        <div className={`rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} p-4`}>
          <p>{notification.message}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    id="apiKey"
                    name="apiKey"
                    value={user.apiKey}
                    readOnly
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    className="ml-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  name="preferences.notifications"
                  checked={user.preferences.notifications}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="notifications" className="ml-2 block text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
              </div>
              
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                  Theme
                </label>
                <select
                  id="theme"
                  name="preferences.theme"
                  value={user.preferences.theme}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  id="language"
                  name="preferences.language"
                  value={user.preferences.language}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 