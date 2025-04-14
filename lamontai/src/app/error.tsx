'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

// This component will catch runtime errors within a segment and show a nice error UI
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('Error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong!</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          We've encountered an error. Please try again or return to the home page.
        </p>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button 
            onClick={reset} 
            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          >
            Try again
          </Button>
          <Button 
            href="/"
            variant="outline"
            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Return to home
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-left dark:border-red-900 dark:bg-red-900/20">
            <p className="font-semibold text-red-800 dark:text-red-400">Error details:</p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-sm text-red-800 dark:text-red-400">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 