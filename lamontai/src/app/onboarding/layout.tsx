'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthChecker from '@/components/AuthChecker';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  return (
    <AuthChecker>
      <div className="min-h-screen bg-white">
        {/* Header with logo and logout */}
        <header className="py-4 px-6 shadow-sm">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <Image 
                src="/logo.svg" 
                alt="Lamont.AI Logo" 
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
          {children}
        </main>
      </div>
    </AuthChecker>
  );
} 