'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import AuthGuard from './AuthGuard'
import ErrorBoundary from './ErrorBoundary'
import ClientOnly from './ClientOnly'
import { SessionProvider } from 'next-auth/react'

interface RootClientWrapperProps {
  children: React.ReactNode
  className?: string
}

const RootClientWrapper: React.FC<RootClientWrapperProps> = ({ 
  children,
  className = '',
}) => {
  // This component prevents hydration issues by wrapping all client-side effects
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevent flash of unstyled content
  }

  // Wrap the app with SessionProvider, ErrorBoundary and AuthGuard
  return (
    <SessionProvider>
      <ErrorBoundary>
        <AuthGuard>
          <div className={cn('min-h-screen flex flex-col', className)} suppressHydrationWarning>
            <ClientOnly>
              {children}
            </ClientOnly>
          </div>
        </AuthGuard>
      </ErrorBoundary>
    </SessionProvider>
  )
}

export default RootClientWrapper 