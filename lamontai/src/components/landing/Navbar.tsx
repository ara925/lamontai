'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Container from '../ui/Container'
import Button from '../ui/Button'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip first render to avoid hydration mismatch
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Initialize with current scroll position
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav 
      suppressHydrationWarning 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm py-3' : 'bg-transparent py-4'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <span className="text-xl font-bold text-gray-900">Lamont.ai</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="#faq" className="text-gray-700 hover:text-blue-600 transition-colors">FAQ</Link>
            <Button href="/auth/login" variant="outline" size="small">Log In</Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-6 h-5">
              <span className={`absolute left-0 top-0 h-0.5 w-6 bg-gray-700 transform transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
              <span className={`absolute left-0 top-2 h-0.5 w-6 bg-gray-700 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`absolute left-0 top-4 h-0.5 w-6 bg-gray-700 transform transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </div>
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100 mt-4 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col space-y-4">
            <Link 
              href="#features" 
              className="text-gray-700 hover:text-blue-600 px-2 py-1 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#pricing" 
              className="text-gray-700 hover:text-blue-600 px-2 py-1 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="#faq" 
              className="text-gray-700 hover:text-blue-600 px-2 py-1 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </Link>
            <Button 
              href="/auth/login" 
              variant="outline" 
              className="justify-start"
              onClick={() => setIsOpen(false)}
            >
              Log In
            </Button>
          </div>
        </div>
      </Container>
    </nav>
  )
} 