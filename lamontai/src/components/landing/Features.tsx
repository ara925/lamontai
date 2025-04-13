'use client'

import React, { useState, useEffect } from 'react'
import Container from '../ui/Container'
import { motion } from 'framer-motion'

interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  index: number
}

export default function Features() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Features data
  const features: FeatureItem[] = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Lightning Fast Generation',
      description: 'Create complete SEO-optimized articles in seconds, not hours. Our AI writes content 10x faster than any copywriter.',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      ),
      title: 'Keyword Optimization',
      description: 'Our AI automatically optimizes your content for the keywords that matter most to your target audience.',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: '100% Original Content',
      description: 'Every article is completely unique and passes plagiarism checks. No duplicate content penalties, ever.',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Bulk Generation',
      description: 'Scale your content production by generating multiple high-quality articles at once with our bulk content tools.',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Content Templates',
      description: 'Choose from dozens of expert-crafted templates designed for various niches and content types.',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Performance Analytics',
      description: "Track the performance of your content with detailed analytics that show what's working and what needs improvement.",
    },
  ]

  const FeatureCard = ({ icon, title, description, index }: FeatureCardProps) => {
    if (!isMounted) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-300"
      >
        <div className="mb-4 bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </motion.div>
    )
  }

  return (
    <section id="features" className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background gradient blobs */}
      {isMounted && (
        <>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-50 rounded-full opacity-70 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-50 rounded-full opacity-70 blur-3xl"></div>
        </>
      )}
      
      <Container className="relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
            <p className="text-sm font-medium text-blue-700">
              Powerful Features
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Everything You Need to Create <span className="text-blue-600">Amazing Content</span>
          </h2>
          <p className="text-xl text-gray-600">
            Our platform gives you all the tools you need to create content that ranks, converts, and drives real results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
        
        {/* Stats section */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Trusted by Content Creators Worldwide</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Join thousands of marketers, bloggers, and agencies who trust our AI to create content that performs.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">200K+</p>
                <p className="text-gray-600 text-sm">Articles Generated</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">15K+</p>
                <p className="text-gray-600 text-sm">Happy Users</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">98%</p>
                <p className="text-gray-600 text-sm">Pass AI Detection</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">70%</p>
                <p className="text-gray-600 text-sm">Avg. Time Saved</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
} 