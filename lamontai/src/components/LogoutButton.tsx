'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth-utils';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'text';
  showText?: boolean;
}

export default function LogoutButton({ 
  className = '', 
  variant = 'default',
  showText = true 
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const handleLogout = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Client-side logout (clears localStorage and redirects)
      logout();
      
      // Optionally force a router refresh if needed
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still attempt to logout client-side even if API fails
      logout();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply styles based on variant
  const baseStyles = "flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500";
  
  let variantStyles = "";
  switch (variant) {
    case 'subtle':
      variantStyles = "bg-gray-100 text-gray-700 hover:bg-gray-200";
      break;
    case 'text':
      variantStyles = "text-gray-700 hover:text-gray-900 hover:bg-gray-100";
      break;
    default:
      variantStyles = "bg-orange-600 text-white hover:bg-orange-700";
  }
  
  const combinedClassName = `${baseStyles} ${variantStyles} ${className}`;
  
  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={combinedClassName}
      aria-label="Logout"
    >
      {/* Logout icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={showText ? "mr-2" : ""}
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      
      {showText && (isLoading ? 'Logging out...' : 'Logout')}
    </button>
  );
}
 