'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Avatar from '@/components/ui/Avatar'

const testimonials = [
  {
    content: 'This platform has completely transformed our content strategy. The AI-generated content is not only high-quality but also ranks incredibly well on Google.',
    author: 'Sarah Johnson',
    role: 'Content Manager',
    company: 'TechStart Inc.',
    imagePath: '/testimonials/sarah.svg'
  },
  {
    content: 'The SEO optimization features are a game-changer. We\'ve seen a 300% increase in organic traffic since using this platform.',
    author: 'Michael Chen',
    role: 'Digital Marketing Director',
    company: 'Growth Labs',
    imagePath: '/testimonials/michael.svg'
  },
  {
    content: 'As a small business owner, this tool has been invaluable. It saves me hours of time and helps me create content that actually converts.',
    author: 'Emily Rodriguez',
    role: 'Founder & CEO',
    company: 'Bloom Digital',
    imagePath: '/testimonials/emma.svg'
  },
]

const Testimonials = () => {
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
            TESTIMONIALS
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Loved by content creators worldwide
          </motion.p>
          <motion.p 
            className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            See what our customers have to say about their experience with our platform.
          </motion.p>
        </div>

        <div className="mt-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="h-full rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/10 hover:shadow-xl transition-shadow duration-300">
                  {/* Quote icon */}
                  <div className="absolute -top-4 -left-4">
                    <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white shadow-lg">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10.5c0-2.355 1.91-4.27 4.27-4.27m0 0c2.36 0 4.27 1.915 4.27 4.27v4.27H12" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <p className="text-lg text-gray-600 mb-8">{testimonial.content}</p>
                    
                    {/* Author */}
                    <div className="flex items-center">
                      <Avatar 
                        name={testimonial.author} 
                        size={48} 
                        imagePath={testimonial.imagePath}
                      />
                      <div className="ml-4">
                        <div className="text-base font-semibold text-gray-900">{testimonial.author}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                        <div className="text-sm text-gray-500">{testimonial.company}</div>
                      </div>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats section */}
        <motion.div 
          className="mt-20 bg-white rounded-2xl shadow-xl p-8 sm:p-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                10M+
              </div>
              <div className="mt-2 text-gray-500">Articles Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                98%
              </div>
              <div className="mt-2 text-gray-500">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                300%
              </div>
              <div className="mt-2 text-gray-500">Traffic Increase</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                24/7
              </div>
              <div className="mt-2 text-gray-500">Support Available</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Testimonials 