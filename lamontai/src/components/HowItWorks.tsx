'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const steps = [
  {
    title: 'Choose Your Topic',
    description: 'Select your content topic and target keywords. Our AI analyzes top-ranking content to understand what works.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    gradient: 'from-blue-600 to-purple-600',
  },
  {
    title: 'Generate Content',
    description: 'Our AI creates high-quality, engaging content optimized for your target keywords and audience.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    gradient: 'from-green-600 to-teal-600',
  },
  {
    title: 'Optimize & Edit',
    description: 'Review and refine your content with our built-in SEO tools. Make sure every piece is perfect before publishing.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    gradient: 'from-orange-600 to-pink-600',
  },
]

const HowItWorks = () => {
  return (
    <div className="relative py-20 overflow-hidden bg-gray-50">
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
            HOW IT WORKS
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Create amazing content in 3 simple steps
          </motion.p>
          <motion.p 
            className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our AI-powered platform makes content creation simple and efficient. Follow these steps to create content that ranks.
          </motion.p>
        </div>

        <div className="mt-16">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="h-full rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/10 hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-r ${step.gradient}`}>
                      <div className="text-white">{step.icon}</div>
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium text-white">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-gray-600">{step.description}</p>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preview section */}
        <motion.div 
          className="mt-20 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Shadow effect */}
            <div className="absolute -inset-x-8 -bottom-16 -top-16 bg-gradient-to-b from-white via-white/5 to-white/50 backdrop-blur-xl rounded-3xl" />
            
            {/* Main preview image */}
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              <Image
                src="/screenshots/editor.svg"
                alt="Content Creation Process"
                width={1200}
                height={675}
                className="rounded-2xl"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
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
                    <p className="text-sm font-medium text-gray-900">SEO Optimized</p>
                    <p className="text-xs text-gray-500">Built for rankings</p>
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
                    <p className="text-sm font-medium text-gray-900">Lightning Fast</p>
                    <p className="text-xs text-gray-500">Create in minutes</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HowItWorks 