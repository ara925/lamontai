'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface ScreenshotDisplayProps {
  src: string
  alt: string
  width: number
  height: number
  showBrowser?: boolean
  url?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide'
  className?: string
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  caption?: string
  animationSpeed?: 'slow' | 'normal' | 'fast'
  animationDelay?: number
}

const ScreenshotDisplay: React.FC<ScreenshotDisplayProps> = ({
  src,
  alt,
  width,
  height,
  showBrowser = false,
  url = 'app.example.com',
  aspectRatio = 'video',
  className = '',
  shadow = 'md',
  rounded = 'lg',
  caption,
  animationSpeed = 'normal',
  animationDelay = 0
}) => {
  // Define aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[16/9]'
  }
  
  // Define shadow classes
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  }
  
  // Define rounded classes
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }
  
  // Define animation speeds
  const animationSpeeds = {
    slow: { duration: 0.8 },
    normal: { duration: 0.5 },
    fast: { duration: 0.3 }
  }

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ ...animationSpeeds[animationSpeed], delay: animationDelay / 1000 }}
        viewport={{ once: true, margin: "-100px" }}
        className={cn(
          'overflow-hidden',
          shadowClasses[shadow], 
          roundedClasses[rounded]
        )}
      >
        {showBrowser && (
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center">
            {/* Browser controls */}
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            
            {/* URL bar */}
            <div className="flex-1 bg-white text-gray-500 text-xs py-1 px-3 rounded-full overflow-hidden">
              <p className="truncate">{url}</p>
            </div>
          </div>
        )}
        
        {/* Screenshot image */}
        <div className={cn('w-full h-full bg-gray-50', aspectRatioClasses[aspectRatio])}>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </motion.div>
      
      {/* Caption */}
      {caption && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600">{caption}</p>
        </div>
      )}
    </div>
  )
}

export default ScreenshotDisplay 