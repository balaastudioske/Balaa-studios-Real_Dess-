'use client'

import React, { useState } from 'react'
import { Mail, Check, Sparkles, Send, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function NewsletterDock() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetEmail = user?.email || email
    if (!targetEmail) return

    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, source: 'newsletter_dock' }),
      })
      if (res.ok) {
        setSubscribed(true)
        setTimeout(() => {
          setIsOpen(false)
          setSubscribed(false)
          setEmail('')
        }, 3500)
      }
    } catch (err) {
      console.error('[Newsletter] Failed to subscribe:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Subscribe Trigger Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto absolute top-20 right-4 z-40 flex items-center gap-2 rounded-xl border border-orange-500/30 bg-black/80 px-3 py-1.5 font-mono text-[11px] font-bold text-orange-200 shadow-xl backdrop-blur-xl hover:border-orange-400 hover:bg-orange-500/15 hover:text-white transition"
          title="Join BALAA VIP Newsletter"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">VIP Newsletter</span>
          <span className="sm:hidden">VIP</span>
        </button>
      )}

      {/* Expanded Subscription Modal / Card */}
      {isOpen && (
        <div className="pointer-events-auto absolute top-20 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-orange-500/30 bg-[#0f0906]/95 p-4 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-orange-950/80 pb-2.5">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Mail className="h-4 w-4 text-orange-400" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                VIP COLLECTOR NEWSLETTER
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-orange-200/70 hover:bg-orange-500/20 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-orange-100/80 font-sans">
            Join the VIP Collector Newsletter for exclusive REAL_DESS track releases, master stem drops, behind-the-scenes production, and artist education.
          </p>

          {subscribed ? (
            <div className="mt-3.5 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 font-mono text-xs font-bold text-emerald-300 animate-in fade-in">
              <Check className="h-4 w-4" />
              <span>You're subscribed to REAL_DESS VIP Drops!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mt-3 space-y-2 font-mono">
              {!user && (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-orange-500/30 bg-black/80 px-3 py-2 text-xs text-white placeholder-orange-200/40 outline-none focus:border-[#f97316] transition"
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#140a05] shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? (
                  'Subscribing…'
                ) : user ? (
                  <>
                    <span>Subscribe with {user.email?.slice(0, 14)}…</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Join VIP Collector Drops</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}