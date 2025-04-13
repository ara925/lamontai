'use client'

import React from 'react'
import Container from '../ui/Container'
import Button from '../ui/Button'

export default function CTA() {
  return (
    <div className="py-20 md:py-32 relative overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary">
        <div className="absolute inset-0 bg-[url('/pattern-dot.svg')] opacity-10"></div>
        
        {/* Animated shapes */}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/10 animate-blob"></div>
        <div className="absolute top-40 right-20 w-60 h-60 rounded-full bg-white/10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 rounded-full bg-white/10 animate-blob animation-delay-4000"></div>
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-12 backdrop-blur-lg bg-white/10 border border-white/20">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Start Tracking Your Baby&apos;s Growth Journey Today
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Join thousands of parents who trust our app to monitor their baby&apos;s development.
              <span className="block mt-2 text-white/80">Get started for free with no credit card required.</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button 
                href="/auth/signup" 
                className="btn-pulse bg-white text-primary hover:bg-white/90 border-0 shadow-xl shadow-black/10"
                size="large"
              >
                Get Started Free
              </Button>
              <Button 
                href="/auth/login" 
                variant="outline" 
                size="large"
                className="border-white text-white hover:bg-white/20"
              >
                Log In
              </Button>
            </div>
            
            <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-6 text-white/80">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>24/7 Customer support</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
} 