'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in its
 * child component tree and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetErrorBoundary(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render the fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(
            this.state.error as Error,
            this.resetErrorBoundary
          );
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary p-6 max-w-lg mx-auto my-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h2>
          <p className="text-red-700 mb-4">
            We apologize for the inconvenience. Please try again later or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-4 p-4 bg-red-100 rounded overflow-auto max-h-[300px]">
              <p className="font-mono text-sm text-red-900 whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
            </div>
          )}
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={this.resetErrorBoundary}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 