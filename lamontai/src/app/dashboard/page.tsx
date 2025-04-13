'use client';

import React, { useEffect, useState } from 'react';
import { getUserData } from '@/lib/auth-utils';
import Button from '@/components/ui/Button';
import api from '@/lib/api-client';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    console.log('Dashboard mounting, checking auth status');
    
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        console.log('Auth token exists:', !!api.auth);
        console.log('Is authenticated:', true);
        console.log('User data exists:', !!userData);
        
        if (userData && userData.name) {
          setUserName(userData.name);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Welcome to your dashboard{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-gray-600 text-sm">
          This is your personalized dashboard where you can manage your content.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-2">Content Stats</h3>
          <div className="text-gray-700">
            <p>Total Articles: <span className="font-bold">0</span></p>
            <p>Published: <span className="font-bold">0</span></p>
            <p>Drafts: <span className="font-bold">0</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-2">Recent Activity</h3>
          <div className="text-gray-700">
            <p>Last login: <span className="font-bold">Today</span></p>
            <p>Last article: <span className="font-bold">N/A</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-2">Account</h3>
          <div className="text-gray-700">
            <p>Plan: <span className="font-bold">Free</span></p>
            <p>Role: <span className="font-bold">User</span></p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Content</h2>
          <Button 
            href="/create" 
            variant="primary" 
            size="medium" 
            icon={<Plus className="h-4 w-4" />}
            className="mt-4"
          >
            Create New Article
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <p>You haven't created any content yet.</p>
            <p>Get started by creating your first article!</p>
          </div>
        </div>
      </div>
    </div>
  );
} 