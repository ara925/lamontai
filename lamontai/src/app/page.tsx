import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import client components with SSR disabled to avoid hydration issues
const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const Hero = dynamic(() => import('@/components/Hero'), { ssr: false })
const Features = dynamic(() => import('@/components/Features'), { ssr: false })
const HowItWorks = dynamic(() => import('@/components/HowItWorks'), { ssr: false })
const Screenshots = dynamic(() => import('@/components/Screenshots'), { ssr: false })
const Testimonials = dynamic(() => import('@/components/Testimonials'), { ssr: false })
const Pricing = dynamic(() => import('@/components/Pricing'), { ssr: false })
const FAQ = dynamic(() => import('@/components/FAQ'), { ssr: false })
const Cta = dynamic(() => import('@/components/Cta'), { ssr: false })
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false })

export default function Home() {
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main className="relative" suppressHydrationWarning>
        <Hero />
        <Features />
        <HowItWorks />
        <Screenshots />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
