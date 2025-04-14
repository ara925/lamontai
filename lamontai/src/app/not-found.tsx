import Link from 'next/link';

/**
 * Custom 404 Not Found page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-8xl font-extrabold text-orange-600 mb-4">404</h1>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <div className="mt-2 text-gray-600 mb-8">
            <p>The page you're looking for doesn't exist or has been moved.</p>
          </div>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Go back home
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 