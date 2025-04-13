'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const screenshots = [
  {
    id: 1,
    title: 'Topic Research',
    description: 'Find high-performing topics and keywords to create content that ranks and drives traffic.',
    image: '/screenshots/topics.svg',
  },
  {
    id: 2,
    title: 'Content Generator',
    description: 'Create SEO-optimized content with our AI-powered generator that saves you time and maximizes results.',
    image: '/screenshots/generate.svg',
  },
  {
    id: 3,
    title: 'Content Editor',
    description: 'Our intuitive editor makes it easy to create and optimize content with real-time SEO suggestions.',
    image: '/screenshots/editor.svg',
  },
  {
    id: 4,
    title: 'SEO Analysis',
    description: "Get detailed SEO insights and recommendations to improve your content's search rankings.",
    image: '/screenshots/seo.svg',
  },
  {
    id: 5,
    title: 'Analytics Dashboard',
    description: 'Track your content performance with comprehensive analytics and insights.',
    image: '/screenshots/analytics.svg',
  },
]

const Screenshots = () => {
  const [activeTab, setActiveTab] = useState(screenshots[0].id)

  return (
    <div className="relative py-20 overflow-hidden bg-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-0 h-72 w-72 rounded-full bg-blue-400 opacity-5 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-purple-400 opacity-5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2 
            className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            PLATFORM FEATURES
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Everything you need to create<br />content that converts
          </motion.p>
          <motion.p 
            className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our platform provides all the tools you need to create, optimize, and track your content performance.
          </motion.p>
        </div>

        <div className="mt-16">
          {/* Tabs */}
          <div className="flex justify-center space-x-4">
            {screenshots.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 bg-white shadow-sm'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Screenshot preview */}
          <div className="mt-8 relative">
            <div className="relative mx-auto max-w-5xl">
              {/* Shadow effect */}
              <div className="absolute -inset-x-8 -bottom-16 -top-16 bg-gradient-to-b from-white via-white/5 to-white/50 backdrop-blur-xl rounded-3xl" />
              
              {/* Screenshots */}
              <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                <AnimatePresence mode="wait">
                  {screenshots.map((screenshot) => (
                    activeTab === screenshot.id && (
                      <motion.div
                        key={screenshot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Image
                          src={screenshot.image}
                          alt={screenshot.title}
                          width={1200}
                          height={675}
                          className="rounded-2xl"
                          priority
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 rounded-2xl">
                          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <h3 className="text-2xl font-bold mb-2">{screenshot.title}</h3>
                            <p className="text-lg text-gray-200">{screenshot.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>

              {/* Floating features */}
              <div className="absolute -left-12 top-1/4">
                <motion.div
                  className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-900/10"
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Real-time Analysis</p>
                      <p className="text-xs text-gray-500">Instant feedback</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="absolute -right-12 bottom-1/4">
                <motion.div
                  className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-900/10"
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Smart Templates</p>
                      <p className="text-xs text-gray-500">Ready to use</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Screenshots 