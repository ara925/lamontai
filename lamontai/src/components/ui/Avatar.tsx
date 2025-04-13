'use client'

import React from 'react'
import Image from 'next/image'

interface AvatarProps {
  name: string
  size?: number
  className?: string
  imagePath?: string
}

export default function Avatar({ name, size = 48, className = '', imagePath }: AvatarProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // If image path is provided, render an image avatar
  if (imagePath) {
    return (
      <div 
        className={`overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Image 
          src={imagePath} 
          alt={name}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%' }}
          className="object-cover"
        />
      </div>
    )
  }

  // Otherwise render initials avatar
  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
} 