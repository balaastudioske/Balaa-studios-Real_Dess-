'use client'

import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { AuthModal } from '@/components/ui/AuthModal'
import { NewsletterDock } from '@/components/ui/NewsletterDock'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
      <NewsletterDock />
    </AuthProvider>
  )
}
