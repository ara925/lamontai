'use client';

import React from 'react';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a simple test page without any authentication to check routing.</p>
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Test Navigation</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className="text-blue-500 hover:underline">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/dashboard/settings" className="text-blue-500 hover:underline">
              Settings
            </Link>
          </li>
          <li>
            <Link href="/dashboard/analytics" className="text-blue-500 hover:underline">
              Analytics
            </Link>
          </li>
          <li>
            <Link href="/dashboard/billing" className="text-blue-500 hover:underline">
              Billing
            </Link>
          </li>
          <li>
            <Link href="/dashboard/content" className="text-blue-500 hover:underline">
              Content
            </Link>
          </li>
          <li>
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </li>
        </ul>
      </div>
      
      <div className="mt-8">
        <button 
          onClick={() => {
            localStorage.setItem('test_key', 'test_value');
            console.log('Test: localStorage test_key set');
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Set localStorage Test Key
        </button>
        
        <button 
          onClick={() => {
            const value = localStorage.getItem('test_key');
            console.log('Test: localStorage test_key value:', value);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
        >
          Check localStorage Test Key
        </button>
      </div>
    </div>
  );
} 