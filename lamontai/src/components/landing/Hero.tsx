'use client'

import React, { useEffect, useState, useRef } from 'react'
import Container from '../ui/Container'
import Link from 'next/link'
import Button from '../ui/Button'

export default function Hero() {
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  
  // Track mouse movement for interactive gradient
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      })
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
      setIsMounted(true)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  // Update CSS variables for the gradient
  useEffect(() => {
    if (isMounted) {
      document.documentElement.style.setProperty('--mouse-x', mousePosition.x.toString())
      document.documentElement.style.setProperty('--mouse-y', mousePosition.y.toString())
    }
  }, [mousePosition, isMounted])

  return (
    <section 
      suppressHydrationWarning
      className="relative py-16 overflow-hidden hero-gradient"
    >
      {/* Subtle background elements with animation */}
      {isMounted && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-100 rounded-full opacity-40 blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-100 rounded-full opacity-40 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-100 rounded-full opacity-30 blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      )}

      <Container className="relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Small label above main heading */}
          <div className="mb-6">
            <p className="inline-block text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full shadow-sm">
              AI Content Generation That Actually Works
            </p>
          </div>

          {/* Main heading with highlighted part */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Create SEO Content That <span className="text-gradient">Ranks on Google</span>
          </h1>

          {/* Subheading text */}
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your content strategy with our AI-powered platform. Generate high-quality articles that drive traffic and boost your search rankings.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button
              href="#"
              variant="primary"
              size="large"
              className="px-8 py-4 font-medium pulse-animation"
            >
              Get Started Free
            </Button>
            <Button
              href="#features"
              variant="outline"
              size="large"
              className="px-8 py-4 font-medium"
            >
              See How It Works
            </Button>
          </div>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span>5-minute setup</span>
            </div>
          </div>
        </div>
        
        {/* Dashboard Preview */}
        {isMounted && (
          <div className="mt-12 relative mx-auto max-w-5xl">
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
              {/* Browser-like header */}
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="mx-auto bg-white rounded px-3 py-0.5 text-xs text-gray-600 border border-gray-200">
                  app.lamont.ai/editor
                </div>
              </div>
              
              {/* Enhanced mockup of editor layout */}
              <div className="bg-white p-4">
                <div className="flex">
                  {/* Left sidebar - enhanced */}
                  <div className="hidden md:block w-[180px] bg-gray-50 rounded-md h-[400px] mr-4 flex-shrink-0">
                    <div className="p-3">
                      <div className="w-20 h-5 bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="w-full h-8 bg-blue-100 rounded flex items-center px-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                          <div className="w-16 h-3 bg-blue-600/30 rounded"></div>
                        </div>
                        <div className="w-full h-8 bg-gray-200 rounded flex items-center px-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                          <div className="w-14 h-3 bg-gray-400/30 rounded"></div>
                        </div>
                        <div className="w-full h-8 bg-gray-200 rounded flex items-center px-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                          <div className="w-12 h-3 bg-gray-400/30 rounded"></div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-1">
                        <div className="w-full h-6 bg-gray-200 rounded"></div>
                        <div className="w-full h-6 bg-gray-200 rounded"></div>
                        <div className="w-full h-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main content area - enhanced */}
                  <div className="flex-grow">
                    <div className="mb-3">
                      <div className="w-full h-8 bg-gray-200 rounded mb-4 flex items-center px-3">
                        <div className="w-24 h-4 bg-gray-400 rounded mr-2"></div>
                        <div className="w-32 h-4 bg-blue-500 rounded"></div>
                      </div>
                      <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
                    </div>
                    
                    {/* Editor content with realistic text blocks */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 h-[350px]">
                      <div className="space-y-3">
                        <div className="w-full h-8 bg-gray-800 rounded"></div>
                        <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
                        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                        
                        <div className="pt-2"></div>
                        
                        <div className="w-full h-6 bg-gray-700 rounded"></div>
                        <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
                        <div className="w-full h-4 bg-gray-200 rounded"></div>
                        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                        
                        <div className="pt-2"></div>
                        
                        <div className="w-2/3 h-6 bg-gray-700 rounded"></div>
                        <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
                        <div className="w-4/5 h-4 bg-gray-200 rounded"></div>
                        
                        <div className="pt-2"></div>
                        
                        <div className="flex space-x-2">
                          <div className="w-24 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                            <div className="w-12 h-3 bg-white rounded"></div>
                          </div>
                          <div className="w-24 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                            <div className="w-12 h-3 bg-gray-500 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add decorative elements around the preview */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-yellow-400 rounded-full opacity-80 blur-sm"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-400 rounded-full opacity-80 blur-sm"></div>
          </div>
        )}
      </Container>
    </section>
  )
} 