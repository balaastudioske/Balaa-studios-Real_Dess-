'use client'

import React, { useState } from 'react'
import { X, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function AuthModal() {
  const { authModalOpen, authModalReason, closeAuthModal, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!authModalOpen) return null

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      // Modal will be closed automatically by AuthContext
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: any) {
      const code = err?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.')
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      aria-label="Account Authentication"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-orange-500/30 bg-[#0f0906]/95 p-6 text-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 font-sans">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-orange-200/70 hover:bg-orange-500/20 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#fbbf24]">
            BALAA STUDIOS SECURE ACCESS
          </span>
          <h2 className="text-xl font-black tracking-tight text-white mt-1">
            {mode === 'signin' ? 'Sign In to Your Account' : 'Create an Account'}
          </h2>
          <p className="mt-1 text-xs text-orange-200/70">
            {authModalReason || 'Log in to place orders, license music, and access master records.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-orange-500/30 bg-white py-3 px-4 font-mono text-xs font-bold text-neutral-900 shadow-md hover:bg-neutral-100 active:scale-[0.98] transition disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-orange-950/80" />
          <span className="absolute bg-[#0f0906] px-3 font-mono text-[10px] uppercase tracking-wider text-orange-300/60">
            or continue with email
          </span>
        </div>

        {/* 2. Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-orange-500/30 bg-black/70 px-3.5 py-2.5 pl-9 text-white placeholder-orange-200/30 outline-none focus:border-[#f97316] transition"
                />
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-orange-400/60" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full rounded-xl border border-orange-500/30 bg-black/70 px-3.5 py-2.5 pl-9 text-white placeholder-orange-200/30 outline-none focus:border-[#f97316] transition"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-400/60" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-orange-500/30 bg-black/70 px-3.5 py-2.5 pl-9 text-white placeholder-orange-200/30 outline-none focus:border-[#f97316] transition"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-400/60" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] py-3 text-center font-mono text-xs font-black uppercase tracking-wider text-[#140a05] shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? (
              'Authenticating…'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-4 text-center text-xs text-orange-200/70 font-sans">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMode('signup')
                }}
                className="font-bold text-[#f97316] hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMode('signin')
                }}
                className="font-bold text-[#f97316] hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}