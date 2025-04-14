'use client';

import React from 'react';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a simple test page to check if the server is working.</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Test API Routes:</h2>
        <ul className="list-disc pl-5">
          <li><a href="/api/ping" className="text-blue-500 hover:underline">/api/ping</a></li>
          <li><a href="/api/test-session" className="text-blue-500 hover:underline">/api/test-session</a></li>
          <li><a href="/api/stest" className="text-blue-500 hover:underline">/api/stest</a></li>
        </ul>
      </div>
    </div>
  );
} 