'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface BalaaUser {
  uid: string
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: BalaaUser | null
  loading: boolean
  authModalOpen: boolean
  authModalReason: string
  openAuthModal: (reason?: string, onSuccess?: () => void) => void
  closeAuthModal: () => void
  signInWithGoogle: () => Promise<BalaaUser | null>
  signInWithEmail: (email: string, pass: string) => Promise<BalaaUser | null>
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<BalaaUser | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapSupabaseUser(sbUser: any): BalaaUser | null {
  if (!sbUser) return null
  return {
    uid: sbUser.id,
    id: sbUser.id,
    email: sbUser.email || null,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || (sbUser.email ? sbUser.email.split('@')[0] : null),
    photoURL: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BalaaUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalReason, setAuthModalReason] = useState('')
  const [postAuthCallback, setPostAuthCallback] = useState<(() => void) | null>(null)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const mapped = session?.user ? mapSupabaseUser(session.user) : null
      setUser(mapped)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mapped = session?.user ? mapSupabaseUser(session.user) : null
      setUser(mapped)
      setLoading(false)

      if (mapped?.email) {
        // Auto-record to newsletter audience
        fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: mapped.email,
            source: 'auth_registration',
          }),
        }).catch(() => {})
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const openAuthModal = useCallback((reason?: string, onSuccess?: () => void) => {
    setAuthModalReason(reason || 'Sign in to complete your transaction and secure your order.')
    if (onSuccess) setPostAuthCallback(() => onSuccess)
    setAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
    setAuthModalReason('')
    setPostAuthCallback(null)
  }, [])

  const triggerPostAuth = useCallback(() => {
    setAuthModalOpen(false)
    if (postAuthCallback) {
      const cb = postAuthCallback
      setPostAuthCallback(null)
      cb()
    }
  }, [postAuthCallback])

  const signInWithGoogle = async () => {
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })
      if (error) throw error
      triggerPostAuth()
      return null
    } catch (error: any) {
      console.error('[AuthProvider] Google sign-in failed:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      })
      if (error) throw error
      const mapped = mapSupabaseUser(data.user)
      setUser(mapped)
      triggerPostAuth()
      return mapped
    } catch (error: any) {
      console.error('[AuthProvider] Email sign-in failed:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: name?.trim() || '',
            name: name?.trim() || '',
          },
        },
      })
      if (error) throw error
      const mapped = mapSupabaseUser(data.user)
      setUser(mapped)
      triggerPostAuth()
      return mapped
    } catch (error: any) {
      console.error('[AuthProvider] Email sign-up failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error: any) {
      console.error('[AuthProvider] Sign-out failed:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authModalOpen,
        authModalReason,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
