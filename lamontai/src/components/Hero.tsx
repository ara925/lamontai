'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import ClientOnly from './ClientOnly'

const Hero = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-gray-50 pt-16 overflow-hidden" suppressHydrationWarning>
      {/* Background gradient circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-100 opacity-60 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-96 h-96 rounded-full bg-blue-100 opacity-60 blur-3xl" />
      </div>

      <ClientOnly>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 flex flex-col items-center">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-sm font-medium mb-6">
              The #1 AI Content Platform for SEO
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Create High-Ranking Content <br />
              <span className="text-[#ff6b00]">In Minutes, Not Days</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              LamontAI helps you create SEO-optimized content that ranks on Google and drives organic traffic. 
              Research topics, generate articles, and publish at scale—all with one powerful platform.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#get-started"
                className="inline-flex items-center justify-center rounded-full bg-[#ff6b00] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-[#ff5500] transition-colors"
                suppressHydrationWarning
              >
                Try Free For 7 Days
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full bg-white border border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                suppressHydrationWarning
              >
                Watch Demo
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-14 flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              { value: "15,000+", label: "Articles Generated" },
              { value: "3x", label: "Average Traffic Growth" },
              { value: "82%", label: "Time Saved vs Manual Writing" }
            ].map((stat, i) => (
              <div key={i} className="px-8">
                <div className="text-4xl font-bold text-[#ff6b00]">{stat.value}</div>
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 relative w-full max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <Image
                src="/screenshots/topics.svg"
                alt="LamontAI Dashboard Preview"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />

              {/* Overlay glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
            </div>

            {/* Feature badges */}
            <div className="absolute -right-6 top-6 rotate-12 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-800">SEO Optimized</div>
            </div>
            <div className="absolute -left-4 top-1/3 -rotate-12 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-800">100% Unique Content</div>
            </div>
          </motion.div>

          {/* Trusted by section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Trusted by content marketers worldwide</p>
            <div className="mt-6 flex flex-wrap justify-center gap-8 opacity-70">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8">
                  <div className="h-full w-32 bg-gray-300 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </ClientOnly>
    </div>
  )
}

export default Hero 