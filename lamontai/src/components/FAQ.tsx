'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  className?: string
}

const faqs: FAQItem[] = [
  {
    question: 'How does the AI writing assistant work?',
    answer:
      'Our AI writing assistant uses advanced language models trained on millions of high-quality articles. Simply input your topic and requirements, and the AI will generate well-structured, engaging content that you can easily customize.',
  },
  {
    question: 'Is the content unique and original?',
    answer:
      'Yes, all content generated by our platform is unique and original. Our AI creates fresh content for each request, and we have built-in plagiarism detection to ensure originality.',
  },
  {
    question: 'Can I customize the writing style and tone?',
    answer:
      'Absolutely! You can specify the tone (professional, casual, friendly, etc.) and style of writing. The AI will adapt to match your preferences while maintaining high-quality output.',
  },
  {
    question: 'How does the SEO optimization work?',
    answer:
      'Our platform analyzes top-ranking content for your target keywords and optimizes your content accordingly. It suggests relevant keywords, helps with meta descriptions, and ensures proper content structure for better search engine rankings.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Yes, we offer a 14-day free trial on all our plans. You can test all features and generate up to 10,000 words during the trial period with no credit card required.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time. There are no long-term contracts or commitments. If you cancel, you\'ll retain access until the end of your current billing period.',
  },
]

const FAQ = ({ className }: FAQProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  return (
    <section id="faq" className={cn("py-24 relative", className)}>
      {/* Background styling */}
      <div className="absolute inset-0 bg-gray-50 z-0"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 bg-blue-100/80 backdrop-blur-sm rounded-full text-blue-700 font-medium text-sm mb-6 shadow-sm">
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Common <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Lamont AI and how it can transform your content strategy.
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-100"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex justify-between items-center w-full p-6 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-medium">{faq.question}</span>
                <span className="ml-6 flex-shrink-0">
                  {openIndex === index ? (
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <div className="h-px bg-gray-200 mb-4"></div>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Still have questions banner */}
        <div className="mt-12 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-4">
            Contact our support team and we'll get back to you as soon as possible.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center text-blue-600 font-medium"
          >
            Contact Support
            <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

export default FAQ 