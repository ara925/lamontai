'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in its child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    this.logError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  logError(error: Error, errorInfo: ErrorInfo): void {
    // In production, you would send this to your error tracking service
    // e.g., Sentry, LogRocket, etc.
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Example of how you might log to a service:
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error);
    // }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                Something went wrong
              </h2>
              <div className="mt-2 text-gray-600 mb-8">
                <p>We apologize for the inconvenience. The error has been logged and we're working on it.</p>
                
                {process.env.NODE_ENV !== 'production' && this.state.error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
                    <p className="text-sm font-medium text-red-800">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-64">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Try again
                </button>
                
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Go back home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 