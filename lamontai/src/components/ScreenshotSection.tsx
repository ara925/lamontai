'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ScreenshotDisplay, { type ScreenshotDisplayProps } from './ui/ScreenshotDisplay'
import { cn } from '@/lib/utils'

type Screenshot = Pick<ScreenshotDisplayProps, 'src' | 'alt' | 'caption' | 'url' | 'width' | 'height'>

interface ScreenshotSectionProps {
  title?: string
  description?: string
  screenshots: Screenshot[]
  className?: string
  layout?: 'grid' | 'carousel' | 'masonry'
  theme?: 'light' | 'dark' | 'gradient'
}

const defaultScreenshots: Screenshot[] = [
  {
    src: '/screenshots/dashboard.jpg',
    alt: 'Dashboard',
    width: 800,
    height: 600,
    caption: 'Intuitive Dashboard',
    url: 'app.lamontai.com/dashboard'
  },
  {
    src: '/screenshots/editor.jpg',
    alt: 'Content Editor',
    width: 800,
    height: 600,
    caption: 'Smart Content Editor',
    url: 'app.lamontai.com/editor'
  },
  {
    src: '/screenshots/analytics.jpg',
    alt: 'Analytics',
    width: 800,
    height: 600,
    caption: 'Detailed Analytics',
    url: 'app.lamontai.com/analytics'
  }
]

const ScreenshotSection = ({
  title = 'Beautiful UI For Every Workflow',
  description = 'Our AI-powered platform features modern interfaces that make content creation and management intuitive.',
  screenshots = defaultScreenshots,
  className,
  layout = 'grid',
  theme = 'light'
}: ScreenshotSectionProps) => {
  // Theme classes
  const themeClasses = {
    light: 'bg-white',
    dark: 'bg-gray-900 text-white',
    gradient: 'bg-gradient-to-br from-indigo-50 via-white to-blue-50'
  }

  // Layout variations
  const renderScreenshots = () => {
    switch (layout) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {screenshots.map((screenshot, index) => (
              <ScreenshotDisplay
                key={index}
                {...screenshot}
                animationDelay={index * 150}
              />
            ))}
          </div>
        )
        
      case 'carousel':
        return (
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x">
            {screenshots.map((screenshot, index) => (
              <div 
                key={index} 
                className="min-w-[85%] md:min-w-[40%] lg:min-w-[30%] snap-center"
              >
                <ScreenshotDisplay
                  {...screenshot}
                  animationDelay={index * 150}
                />
              </div>
            ))}
          </div>
        )
        
      case 'masonry':
        return (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {screenshots.map((screenshot, index) => (
              <div key={index} className="break-inside-avoid mb-6">
                <ScreenshotDisplay
                  {...screenshot}
                  animationDelay={index * 150}
                />
              </div>
            ))}
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <section className={cn('py-16 md:py-24', themeClasses[theme], className)}>
      <div className="container mx-auto px-4">
        {(title || description) && (
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            {title && (
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {title}
              </motion.h2>
            )}
            
            {description && (
              <motion.p 
                className={cn(
                  "text-lg md:text-xl", 
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {description}
              </motion.p>
            )}
          </div>
        )}
        
        {renderScreenshots()}
      </div>
    </section>
  )
}

export default ScreenshotSection 