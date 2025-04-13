'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/dashboard/Sidebar';
import LogoutButton from '@/components/LogoutButton';
import AuthChecker from '@/components/AuthChecker';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthChecker>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="bg-white border-b">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
              <h1 className="text-xl font-bold">Lamont.ai</h1>
              <div className="flex items-center">
                <LogoutButton 
                  className="rounded-full px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
                  variant="default"
                  showText={true}
                />
              </div>
            </div>
          </header>
          <main className="flex-1 bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthChecker>
  );
} 