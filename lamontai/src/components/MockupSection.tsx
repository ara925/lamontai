'use client'

import React from 'react'
import ScreenshotDisplay from './ui/ScreenshotDisplay'
import { motion } from 'framer-motion'

const screenshots = {
  dashboard: {
    src: '/screenshots/dashboard-main.jpg',
    alt: 'AI Writing Dashboard',
    width: 1200,
    height: 675,
    showBrowser: true,
    url: 'app.lamontai.com/dashboard',
    aspectRatio: 'video' as const,
  },
  editor: {
    src: '/screenshots/editor.jpg',
    alt: 'Content Editor',
    width: 600,
    height: 600,
    showBrowser: true,
    url: 'app.lamontai.com/editor',
    aspectRatio: 'square' as const,
  },
  analytics: {
    src: '/screenshots/analytics.jpg',
    alt: 'Analytics Dashboard',
    width: 600,
    height: 600,
    showBrowser: true,
    url: 'app.lamontai.com/analytics',
    aspectRatio: 'square' as const,
  },
  mobileHome: {
    src: '/screenshots/mobile-home.jpg',
    alt: 'Mobile Home Screen',
    width: 280,
    height: 373,
    aspectRatio: 'portrait' as const,
    className: 'max-w-[280px] mx-auto',
  },
  mobileEditor: {
    src: '/screenshots/mobile-editor.jpg',
    alt: 'Mobile Editor',
    width: 280,
    height: 373,
    aspectRatio: 'portrait' as const,
    className: 'max-w-[280px] mx-auto',
  },
  mobileResults: {
    src: '/screenshots/mobile-results.jpg',
    alt: 'Mobile Results',
    width: 280,
    height: 373,
    aspectRatio: 'portrait' as const,
    className: 'max-w-[280px] mx-auto',
  },
}

const MockupSection = () => {
  return (
    <section className="py-20 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful AI Writing Platform</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how our AI-powered platform helps you create engaging content instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main dashboard screenshot */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ScreenshotDisplay {...screenshots.dashboard} />
          </motion.div>

          {/* Side screenshots */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ScreenshotDisplay {...screenshots.editor} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <ScreenshotDisplay {...screenshots.analytics} />
            </motion.div>
          </div>
        </div>

        {/* Mobile view mockups */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ScreenshotDisplay {...screenshots.mobileHome} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ScreenshotDisplay {...screenshots.mobileEditor} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ScreenshotDisplay {...screenshots.mobileResults} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default MockupSection 