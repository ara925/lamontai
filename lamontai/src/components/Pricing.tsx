'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false)
  
  const tiers = [
    {
      name: 'Starter',
      id: 'starter',
      priceMonthly: 29,
      priceYearly: 290,
      description: 'Perfect for small blogs and websites looking to grow organic traffic.',
      features: [
        'Generate 5 articles per month',
        'SEO optimization for keywords',
        'Basic analytics dashboard',
        'Email support',
        'WordPress integration',
        'Export to PDF/HTML'
      ],
      mostPopular: false,
      cta: 'Get Started'
    },
    {
      name: 'Professional',
      id: 'professional',
      priceMonthly: 79,
      priceYearly: 790,
      description: 'For growing websites and businesses that need more content and features.',
      features: [
        'Generate 20 articles per month',
        'Advanced SEO optimization',
        'Full analytics dashboard',
        'Priority email support',
        'WordPress & Webflow integration',
        'Export to PDF/HTML/Markdown',
        'Content scheduling',
        'Custom templates'
      ],
      mostPopular: true,
      cta: 'Start 7-day Trial'
    },
    {
      name: 'Enterprise',
      id: 'enterprise',
      priceMonthly: 199,
      priceYearly: 1990,
      description: 'For larger businesses with high content needs and custom requirements.',
      features: [
        'Generate 50 articles per month',
        'Premium SEO optimization',
        'Advanced analytics & reporting',
        'Dedicated account manager',
        'All integrations (WordPress, Webflow, etc.)',
        'Export to all formats',
        'Content scheduling',
        'Custom templates',
        'API access',
        'White labeling'
      ],
      mostPopular: false,
      cta: 'Contact Sales'
    }
  ]

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-sm font-medium mb-4"
          >
            Simple Pricing
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Choose Your <span className="text-[#ff6b00]">Plan</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Get started with our affordable plans and scale as your content needs grow.
          </motion.p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-10">
            <span className={`text-sm ${!isYearly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Monthly</span>
            <button
              type="button"
              className="relative mx-4 flex h-6 w-12 rounded-full bg-gray-200 px-0.5 py-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
              onClick={() => setIsYearly(!isYearly)}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  isYearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Yearly
              <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${
                tier.mostPopular ? 'border-[#ff6b00] relative' : 'border-gray-200'
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-[#ff6b00] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-md transform rotate-3">
                  Most Popular
                </div>
              )}
              
              <div className={`p-8 ${tier.mostPopular ? 'bg-gradient-to-br from-orange-50 to-white' : ''}`}>
                <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-2 text-gray-600">{tier.description}</p>
                
                <div className="mt-6 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                    ${isYearly ? tier.priceYearly : tier.priceMonthly}
                  </span>
                  <span className="ml-1 text-xl font-medium text-gray-500">
                    {isYearly ? '/year' : '/month'}
                  </span>
                </div>
                
                <button
                  type="button"
                  className={`mt-8 w-full rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors ${
                    tier.mostPopular
                      ? 'bg-[#ff6b00] text-white hover:bg-[#ff5500] shadow-md'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
              
              <div className="p-8 bg-white border-t border-gray-100">
                <ul className="space-y-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className={`flex-shrink-0 ${tier.mostPopular ? 'text-[#ff6b00]' : 'text-gray-600'}`}>
                        <Check className="h-5 w-5" />
                      </div>
                      <span className="ml-3 text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">We're here to help you make the right choice for your business.</p>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 shadow-sm border border-gray-300 hover:bg-gray-50"
          >
            View FAQ
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
        
        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 flex flex-col md:flex-row items-center justify-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-lg font-bold text-gray-900">14-Day Money-Back Guarantee</h4>
            <p className="text-gray-600">Not satisfied? Get a full refund within 14 days, no questions asked.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing 