'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useAnimation } from 'framer-motion'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const HeroSection = () => {
  const [isMounted, setIsMounted] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    setIsMounted(true)
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    })
  }, [controls])

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-50/80 via-indigo-100/70 to-purple-100/60 blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-50/80 via-pink-100/70 to-rose-100/60 blur-3xl opacity-60 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-blue-100/30 via-transparent to-purple-100/30 blur-3xl opacity-40 animate-slow-spin"></div>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Enhanced left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            className="max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 mb-8 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
              <span className="text-sm font-semibold">AI-Powered Content Creation</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-8">
              <span className="block mb-2">Write Better</span>
              <span className="block bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Content Faster
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Generate high-quality, SEO-optimized content in seconds. 
              Let AI handle the writing while you focus on growing your business.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <Button
                href="/auth/signup"
                size="large"
                className="px-8 py-4 font-medium pulse-animation"
              >
                Start Writing Free
              </Button>
              <Button
                variant="outline"
                size="large"
                className="px-8 py-4 font-medium group"
              >
                Watch Demo
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </Button>
            </div>

            <div className="flex flex-wrap gap-8">
              <div className="flex items-center">
                <div className="flex -space-x-3 mr-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Image
                      key={i}
                      src={`/avatar-${i}.jpg`}
                      alt={`User ${i}`}
                      width={36}
                      height={36}
                      className="rounded-full border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">5,000+ users</p>
                  <p className="text-gray-500">Trust our platform</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">4.9/5 rating</p>
                  <p className="text-gray-500">From 1,000+ reviews</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced right column with editor mockup */}
          {isMounted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 bg-white backdrop-blur-sm">
                {/* Browser-like header */}
                <div className="bg-gray-100/80 px-4 py-3 border-b border-gray-200/50 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto bg-white/80 rounded-md px-4 py-1 text-sm text-gray-600 border border-gray-200/50 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    app.lamont.ai/editor
                  </div>
                </div>

                {/* Editor content */}
                <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                  <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="hidden md:block w-48 space-y-4">
                      <div className="h-8 bg-gray-100 rounded-md w-32"></div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={cn(
                            "h-10 rounded-md flex items-center px-3 gap-2",
                            i === 1 ? "bg-blue-50" : "bg-gray-100"
                          )}>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              i === 1 ? "bg-blue-600" : "bg-gray-400"
                            )}></div>
                            <div className={cn(
                              "h-2 rounded",
                              i === 1 ? "bg-blue-200 w-20" : "bg-gray-200 w-16"
                            )}></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 space-y-4">
                      <div className="h-10 bg-gray-100 rounded-md w-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="pt-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <div className="h-9 w-24 bg-blue-600 rounded-md"></div>
                        <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

export default HeroSection 