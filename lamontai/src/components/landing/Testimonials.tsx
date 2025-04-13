'use client'

import React, { useState } from 'react'
import Container from '../ui/Container'

interface TestimonialProps {
  content: string
  author: string
  role: string
  company: string
  avatar: string
}

const testimonials: TestimonialProps[] = [
  {
    content: "Lamont.ai has revolutionized our content strategy. We've seen a 230% increase in organic traffic within just 3 months of using their AI content platform.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "GrowthPulse",
    avatar: "/avatars/avatar-1.jpg"
  },
  {
    content: "The quality of the AI-generated content is exceptional. Our articles are consistently ranking on the first page of Google, and the time saved is invaluable.",
    author: "Michael Chen",
    role: "SEO Specialist",
    company: "RankWise",
    avatar: "/avatars/avatar-2.jpg"
  },
  {
    content: "I was skeptical about AI content at first, but Lamont.ai completely changed my mind. The platform understands SEO fundamentals better than many human writers.",
    author: "Emma Rodriguez",
    role: "Content Manager",
    company: "ContentLabs",
    avatar: "/avatars/avatar-3.jpg"
  },
  {
    content: "We've tried several AI content tools, but Lamont.ai stands out with its ability to create content that actually ranks. Our conversion rate has improved by 45%.",
    author: "David Wilson",
    role: "CEO",
    company: "ScaleUp",
    avatar: "/avatars/avatar-4.jpg"
  },
  {
    content: "The ROI we've achieved with Lamont.ai is incredible. The platform pays for itself with just one well-ranked article generating consistent leads.",
    author: "Jessica Park",
    role: "Growth Lead",
    company: "LeadForge",
    avatar: "/avatars/avatar-5.jpg"
  },
  {
    content: "Lamont.ai doesn't just create content; it creates content that converts. Our blog has become our top lead generation channel since using the platform.",
    author: "Thomas Lee",
    role: "Digital Strategist",
    company: "DigitalEdge",
    avatar: "/avatars/avatar-6.jpg"
  }
]

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Trusted by Content Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            See why thousands of marketers and SEO experts choose our platform to scale their content production.
          </p>
        </div>

        {/* Featured testimonial */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="grid md:grid-cols-5 h-full">
            <div className="p-8 md:p-12 md:col-span-3">
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
                "Since implementing Lamont.ai, our organic traffic has grown by over 300% in just six months. The AI writer consistently produces content that ranks in the top 3 positions for competitive keywords."
              </blockquote>
              <div className="flex items-center">
                <div className="mr-4 relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {/* User initials */}
                  AT
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Alex Thompson</h4>
                  <p className="text-gray-600">CMO, TechGrowth</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/90 to-blue-600 md:col-span-2 flex items-center justify-center p-8 md:p-0">
              <div className="text-center text-white">
                <div className="text-5xl font-bold mb-3">+320%</div>
                <p className="text-xl mb-2">Organic Traffic</p>
                <div className="w-16 h-1 bg-white/30 mx-auto mb-6"></div>
                <div className="text-5xl font-bold mb-3">75%</div>
                <p className="text-xl mb-2">Time Saved</p>
                <div className="w-16 h-1 bg-white/30 mx-auto mb-6"></div>
                <div className="text-5xl font-bold mb-3">4.2x</div>
                <p className="text-xl">ROI Increase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial carousel */}
        <div className="relative bg-gray-50 rounded-xl p-8 py-12">
          <div className="max-w-3xl mx-auto">
            <blockquote className="text-xl md:text-2xl text-center text-gray-800 mb-8">
              "{testimonials[activeIndex].content}"
            </blockquote>
            <div className="flex items-center justify-center">
              <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {/* First letter of first name and last name */}
                {testimonials[activeIndex].author.split(' ').map(name => name[0]).join('')}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{testimonials[activeIndex].author}</h4>
                <p className="text-gray-600">{testimonials[activeIndex].role}, {testimonials[activeIndex].company}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:shadow-lg text-gray-800 hover:bg-gray-100 transition-all border border-gray-100 w-12 h-12 flex items-center justify-center"
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:shadow-lg text-gray-800 hover:bg-gray-100 transition-all border border-gray-100 w-12 h-12 flex items-center justify-center"
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Logos */}
        <div className="mt-16">
          <p className="text-center text-gray-500 mb-8">Trusted by innovative companies</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            <div className="h-8 w-auto">
              <svg className="h-full w-auto text-gray-400" viewBox="0 0 124 24" fill="currentColor">
                <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12 12-5.373 12-12zm-12 9c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"></path>
                <path d="M7 14a1 1 0 110-2 1 1 0 010 2zm5-1a1 1 0 10-2 0 1 1 0 002 0zm5 0a1 1 0 10-2 0 1 1 0 002 0z"></path>
              </svg>
            </div>
            <div className="h-6 w-auto">
              <svg className="h-full w-auto text-gray-400" viewBox="0 0 124 24" fill="currentColor">
                <path d="M24 9H0v6h24V9zm-9 15h-6v-6h6v6zM9 0h6v6H9V0zM0 0h6v6H0V0zm15 0h9v6h-9V0zM0 18h6v6H0v-6zm15 0h9v6h-9v-6z"></path>
              </svg>
            </div>
            <div className="h-8 w-auto">
              <svg className="h-full w-auto text-gray-400" viewBox="0 0 124 24" fill="currentColor">
                <path d="M5.893 18L2 12.79 5.893 7l.446.447L3.113 12.79l3.225 5.343L5.893 18zM8 17h-.5v-1H8v1zm1.5-6h-1V7h1v4zm3.5 2a2 2 0 11-4 0 2 2 0 014 0zm5.93 5l-3.893-5.21L19.93 7l.446.447-3.225 5.343 3.225 5.343-.446.447zM16 17h-.5v-1h.5v1zm1.5-6h-1V7h1v4z"></path>
              </svg>
            </div>
            <div className="h-5 w-auto">
              <svg className="h-full w-auto text-gray-400" viewBox="0 0 124 24" fill="currentColor">
                <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1.293 4.293l5.414 5.414a1 1 0 010 1.414l-5.414 5.414a1 1 0 01-1.414-1.414L15.585 13H8a1 1 0 010-2h7.585l-3.707-3.707a1 1 0 011.414-1.414z"></path>
              </svg>
            </div>
            <div className="h-7 w-auto">
              <svg className="h-full w-auto text-gray-400" viewBox="0 0 124 24" fill="currentColor">
                <path d="M24 15.022h-7v7h-3v-7H7v-3h7v-7h3v7h7z"></path>
                <path d="M5 0h14v3H5zM19 21H5v3h14zM5 9h3v6H5zM16 9h3v6h-3z"></path>
              </svg>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
} 