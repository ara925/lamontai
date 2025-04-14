'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function TestAuth() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setMessage('Signing in...');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setMessage(`Login error: ${result.error}`);
      } else {
        setMessage('Login successful!');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('Signing out...');
    
    try {
      await signOut({ redirect: false });
      setMessage('Logout successful!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">NextAuth Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Session Status: {status}</h2>
        {session ? (
          <div>
            <p>Logged in as: {session.user?.email}</p>
            <p>Name: {session.user?.name}</p>
            <pre className="mt-2 p-2 bg-gray-200 rounded text-xs overflow-x-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Sign In
          </button>
          
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {message && (
        <div className="p-3 bg-gray-100 rounded">
          <p>{message}</p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="font-semibold mb-2">API Routes for Testing:</h2>
        <ul className="list-disc pl-5">
          <li><a href="/api/test-session" className="text-blue-500 hover:underline" target="_blank">/api/test-session</a> - Check server session</li>
          <li><a href="/api/auth/signin" className="text-blue-500 hover:underline" target="_blank">/api/auth/signin</a> - NextAuth signin page</li>
          <li><a href="/api/auth/session" className="text-blue-500 hover:underline" target="_blank">/api/auth/session</a> - NextAuth session endpoint</li>
          <li><a href="/api/stest" className="text-blue-500 hover:underline" target="_blank">/api/stest</a> - Simple test route</li>
        </ul>
      </div>
    </div>
  );
} 