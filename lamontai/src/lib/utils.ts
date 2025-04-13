import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import React from 'react'

/**
 * Combines multiple class names into a single string
 * using clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helps prevent hydration issues by wrapping components
 * that might have client-server differences
 */
export function withSuppressHydration<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const WithSuppressHydration = (props: P) => {
    return React.createElement(Component, {
      ...props,
      suppressHydrationWarning: true
    });
  };
  
  const displayName = Component.displayName || Component.name || 'Component';
  WithSuppressHydration.displayName = `withSuppressHydration(${displayName})`;
  
  return WithSuppressHydration;
}

/**
 * Utility to safely access browser APIs only after hydration
 * @param callback Function to execute on the client side
 */
export function safeExecuteOnClient(callback: () => void): void {
  if (typeof window !== 'undefined') {
    // Check if document is fully loaded
    if (document.readyState === 'complete') {
      callback();
    } else {
      // Wait for document to load
      window.addEventListener('load', callback, { once: true });
    }
  }
} 