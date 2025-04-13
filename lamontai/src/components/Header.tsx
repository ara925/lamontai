'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ClientOnly from './ClientOnly'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : ''}`} suppressHydrationWarning>
      <ClientOnly>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600" suppressHydrationWarning>
                LamontAI
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8">
              <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900" suppressHydrationWarning>
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900" suppressHydrationWarning>
                Pricing
              </Link>
              <Link href="#faq" className="text-sm font-medium text-gray-700 hover:text-gray-900" suppressHydrationWarning>
                FAQ
              </Link>
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900" suppressHydrationWarning>
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                suppressHydrationWarning
              >
                Start Writing for Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:text-gray-900"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                suppressHydrationWarning
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="lg:hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-1 pb-3 pt-2">
                  <Link
                    href="#features"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900"
                    suppressHydrationWarning
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900"
                    suppressHydrationWarning
                  >
                    Pricing
                  </Link>
                  <Link
                    href="#faq"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900"
                    suppressHydrationWarning
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900"
                    suppressHydrationWarning
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-md"
                    suppressHydrationWarning
                  >
                    Start Writing for Free
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </ClientOnly>
    </header>
  )
}

export default Header 