'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient' | 'glass'
  size?: 'small' | 'medium' | 'large'
  href?: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  children: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  animated?: boolean
}

const Button = ({
  variant = 'primary',
  size = 'medium',
  href,
  className,
  onClick,
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  animated = false,
  ...props
}: ButtonProps) => {
  // Base classes - using direct Tailwind classes
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none'
  
  // Variant classes - using direct Tailwind classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-gray-900 hover:bg-gray-50 shadow-sm hover:shadow-md',
    outline: 'bg-transparent border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
    gradient: 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-sm hover:shadow-md',
    glass: 'bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border border-white border-opacity-20 text-white hover:bg-opacity-30 shadow-sm hover:shadow-md'
  }
  
  // Size classes - using direct Tailwind classes
  const sizeClasses = {
    small: 'text-sm px-4 py-2',
    medium: 'text-base px-5 py-2.5',
    large: 'text-lg px-6 py-3'
  }
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : ''
  
  // Animation classes
  const animationClasses = animated ? 'transform hover:-translate-y-1 active:translate-y-0' : ''
  
  // Combine all classes using the utility function
  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    animationClasses,
    className
  )
  
  // Render button contents with icon
  const renderContents = () => {
    if (!icon) return children
    
    return (
      <>
        {iconPosition === 'left' && <span className="mr-2">{icon}</span>}
        <span>{children}</span>
        {iconPosition === 'right' && <span className="ml-2">{icon}</span>}
      </>
    )
  }
  
  // Render as link if href is provided
  if (href) {
    return (
      <Link 
        href={href} 
        className={buttonClasses}
        onClick={onClick as any}
        suppressHydrationWarning
      >
        {renderContents()}
      </Link>
    )
  }
  
  // Otherwise render as button
  return (
    <button 
      className={buttonClasses} 
      onClick={onClick}
      {...props}
      suppressHydrationWarning
    >
      {renderContents()}
    </button>
  )
}

export default Button 