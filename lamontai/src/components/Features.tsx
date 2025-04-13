'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import ClientOnly from './ClientOnly'

const Features = () => {
  const features = [
    {
      title: "SEO Optimization",
      description: "Every article is optimized with the right keywords, headings, and structure to rank higher on search engines.",
      icon: (
        <svg className="h-10 w-10 text-[#ff6b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      )
    },
    {
      title: "Human-Like Content",
      description: "Advanced AI that writes content indistinguishable from human writers, avoiding the typical AI detection flags.",
      icon: (
        <svg className="h-10 w-10 text-[#ff6b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
    },
    {
      title: "Bulk Generation",
      description: "Generate multiple articles simultaneously, saving you hours of content creation time every week.",
      icon: (
        <svg className="h-10 w-10 text-[#ff6b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z M8 4v16" />
        </svg>
      )
    },
    {
      title: "Multilingual Support",
      description: "Create content in 30+ languages to reach global audiences and expand your international presence.",
      icon: (
        <svg className="h-10 w-10 text-[#ff6b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      )
    },
    {
      title: "Automated Publishing",
      description: "Schedule and automatically publish content to your website, WordPress, or other CMS platforms.",
      icon: (
        <svg className="h-10 w-10 text-[#ff6b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Analytics Dashboard",
      description: "Track your content performance with detailed analytics on traffic, rankings, and conversion rates.",
      icon: (
        <svg className="h-10 w-10 text-[#ff6b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  return (
    <section id="features" className="py-20 bg-white" suppressHydrationWarning>
      <ClientOnly>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              Features That Make Us <span className="text-[#ff6b00]">Different</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Our AI-powered platform combines cutting-edge technology with SEO expertise to deliver content that ranks and converts.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-orange-50 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
          {/* How it works section */}
          <div className="mt-24" id="how-it-works">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold text-gray-900"
              >
                How It <span className="text-[#ff6b00]">Works</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Get started in minutes and watch your organic traffic grow on autopilot
              </motion.p>
            </div>
            
            <div className="relative">
              {/* Connection line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2 hidden md:block"></div>
              
              <div className="space-y-24">
                {[
                  {
                    step: "01",
                    title: "Choose your topics",
                    description: "Select the topics you want to rank for or let our AI suggest profitable keywords in your niche.",
                    image: "/screenshots/topics.svg"
                  },
                  {
                    step: "02",
                    title: "Generate optimized content",
                    description: "Our AI creates fully optimized articles with the right keywords, headings, and structure to rank higher.",
                    image: "/screenshots/generate.svg"
                  },
                  {
                    step: "03",
                    title: "Publish and monitor",
                    description: "Schedule publishing to your website and track performance with our analytics dashboard.",
                    image: "/screenshots/publish.svg"
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className={`relative flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
                  >
                    {/* Step number */}
                    <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 top-0 z-10 bg-white rounded-full w-12 h-12 flex items-center justify-center border-2 border-[#ff6b00] text-[#ff6b00] font-bold">
                      {item.step}
                    </div>
                    
                    {/* Content */}
                    <div className="md:w-1/2 text-center md:text-left pt-16 md:pt-0">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                      <p className="text-gray-600 text-lg">{item.description}</p>
                    </div>
                    
                    {/* Image */}
                    <div className="md:w-1/2 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={600}
                        height={400}
                        className="w-full h-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </section>
  )
}

export default Features 