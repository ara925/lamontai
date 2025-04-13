'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.svg" 
              alt="Lamont AI" 
              width={120} 
              height={40} 
              className="h-8 w-auto"
              style={{ height: 'auto' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              FAQ
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Login
            </Link>
            <Button href="/signup" variant="primary" size="medium">
              Get Started
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-lg">
            <nav className="flex flex-col space-y-4 px-4">
              <Link 
                href="#features" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#how-it-works" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="#pricing" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="#faq" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Button 
                href="/signup" 
                variant="primary" 
                size="medium"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navigation 