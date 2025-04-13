/**
 * Utility functions for authentication (client-side only)
 */

import { jwtDecode } from 'jwt-decode';
import { redirect } from 'next/navigation';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Check if the user is authenticated by validating with the server
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include', // This sends cookies with the request
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Store user data in session storage
 */
export function setUserData(user: any) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('user', JSON.stringify(user));
  }
}

/**
 * Get user data from session storage or from the server
 */
export async function getUserData(): Promise<any> {
  if (typeof window === 'undefined') return null;
  
  // First try to get from session storage
  const sessionData = sessionStorage.getItem('user');
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error parsing user data from session storage:', error);
    }
  }
  
  // If not in session storage, fetch from server
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        // Store for future use
        setUserData(data.data);
        return data.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Logout the user by calling the logout API endpoint
 * and then redirecting to the login page
 */
export async function logout() {
  if (typeof window === 'undefined') return;
  
  try {
    // Call logout API to clear server-side session
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    // Clear local storage
    sessionStorage.removeItem('user');
  } catch (error) {
    console.error('Error during logout:', error);
  }
  
  // Redirect to login page
  window.location.href = '/auth/login';
}

/**
 * Create fetch options with credentials included
 */
export function createAuthFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    credentials: 'include', // Always include credentials (cookies)
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
}

/**
 * Fetch wrapper that includes credentials
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  const authOptions = createAuthFetchOptions(options);
  
  const response = await fetch(fullUrl, authOptions);
  
  // If unauthorized and not already on login page, redirect to login
  if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }
  
  return response;
} 