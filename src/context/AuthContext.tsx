'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  authModalOpen: boolean
  authModalReason: string
  openAuthModal: (reason?: string, onSuccess?: () => void) => void
  closeAuthModal: () => void
  signInWithGoogle: () => Promise<User | null>
  signInWithEmail: (email: string, pass: string) => Promise<User | null>
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<User | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalReason, setAuthModalReason] = useState('')
  const [postAuthCallback, setPostAuthCallback] = useState<(() => void) | null>(null)

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      if (currentUser && currentUser.email) {
        // Automatically save user profile and subscribe email to newsletter/audience
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          )

          // Auto-record to newsletter audience
          fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentUser.email,
              source: 'auth_registration',
            }),
          }).catch(() => {})
        } catch (e) {
          console.warn('[AuthProvider] Failed to sync user to Firestore:', e)
        }
      }
    })

    return () => unsubscribe()
  }, [])

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
      const result = await signInWithPopup(auth, googleProvider)
      triggerPostAuth()
      return result.user
    } catch (error: any) {
      console.error('[AuthProvider] Google sign-in failed:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass)
      triggerPostAuth()
      return result.user
    } catch (error: any) {
      console.error('[AuthProvider] Email sign-in failed:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass)
      if (name && result.user) {
        await updateProfile(result.user, { displayName: name.trim() })
      }
      triggerPostAuth()
      return result.user
    } catch (error: any) {
      console.error('[AuthProvider] Email sign-up failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
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