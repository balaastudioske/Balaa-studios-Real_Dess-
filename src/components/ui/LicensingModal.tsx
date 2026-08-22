'use client'

import React, { useState, useEffect } from 'react'
import { Music, ShieldCheck, Check, ArrowRight, X, Sparkles, Copy, ChevronDown, Info, ExternalLink, Clock, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { REAL_DESS_MASTER_LICENSES, REAL_DESS_MEDIA, type MasterLicense } from '@/lib/balaa-catalog'
import { MPESA_TILL_NUMBER, formatKshPrice } from '@/lib/mpesa-till'
import { useAuth } from '@/context/AuthContext'
import { BalaaOrder } from '@/types/orders'

interface LicensingModalProps {
  onClose: () => void
}

export const LicensingModal: React.FC<LicensingModalProps> = ({ onClose }) => {
  const { user, openAuthModal } = useAuth()
  const activeMediaId = useAppStore((s) => s.activeMediaId)
  const setActiveMediaId = useAppStore((s) => s.setActiveMediaId)

  const [selectedSongId, setSelectedSongId] = useState<string>(activeMediaId || REAL_DESS_MEDIA[0].id)
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('creator')
  const [currency, setCurrency] = useState<'KSH' | 'USD'>('KSH')
  const [showTerms, setShowTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<BalaaOrder | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedSong = REAL_DESS_MEDIA.find((m) => m.id === selectedSongId) || REAL_DESS_MEDIA[0]
  const activeLicense = REAL_DESS_MASTER_LICENSES.find((l) => l.id === selectedLicenseId) || REAL_DESS_MASTER_LICENSES[1]

  const amount = currency === 'KSH' ? activeLicense.priceKsh : activeLicense.priceUsd
  const displayPrice = currency === 'KSH' ? formatKshPrice(activeLicense.priceKsh) : `$${activeLicense.priceUsd}`

  // Poll for admin payment confirmation
  useEffect(() => {
    if (!currentOrder || currentOrder.status !== 'pending' || isConfirmed) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders?orderId=${currentOrder.id}`)
        const data = await res.json()
        if (data.order && data.order.status === 'confirmed') {
          setIsConfirmed(true)
          setCurrentOrder(data.order)
        }
      } catch (e) {
        console.warn('[LicensingModal] Poll error:', e)
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [currentOrder, isConfirmed])

  const handleCheckout = async () => {
    if (!user) {
      openAuthModal('Sign in with Google or Email to license this track and generate master clearance.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || '',
          type: 'license',
          itemId: activeLicense.id,
          itemTitle: `${activeLicense.name} License — ${selectedSong.title}`,
          amount,
          currency,
          metadata: {
            songId: selectedSong.id,
            songTitle: selectedSong.title,
            licenseTier: activeLicense.id,
            licenseName: activeLicense.name,
            rights: activeLicense.rights,
          },
        }),
      })
      const data = await res.json()
      if (data.order) {
        setCurrentOrder(data.order)
      }
    } catch (err) {
      console.error('[LicensingModal] Checkout failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyTill = () => {
    navigator.clipboard?.writeText(MPESA_TILL_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyRef = () => {
    if (currentOrder?.reference) {
      navigator.clipboard?.writeText(currentOrder.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      aria-label="License a REAL_DESS Song"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-orange-500/30 bg-[#0f0906]/95 p-6 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-950/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-orange-500/40 bg-orange-500/15 p-2.5 text-orange-400">
              <Music className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#fbbf24]">
                DIRECT MASTER LICENSING
              </span>
              <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
                License a REAL_DESS Song
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="flex items-center rounded-lg border border-orange-500/30 bg-black/60 p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setCurrency('KSH')}
                className={`rounded px-2.5 py-1 font-bold transition ${
                  currency === 'KSH' ? 'bg-[#f97316] text-[#140a05]' : 'text-orange-200/70 hover:text-white'
                }`}
              >
                KSh
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`rounded px-2.5 py-1 font-bold transition ${
                  currency === 'USD' ? 'bg-[#f97316] text-[#140a05]' : 'text-orange-200/70 hover:text-white'
                }`}
              >
                USD
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-orange-200/70 hover:bg-orange-500/20 hover:text-white transition"
              aria-label="Close licensing modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Step 1: Choose Song */}
        <div className="mt-4">
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-orange-300">
            1. Choose Song
          </label>
          <div className="relative mt-1.5">
            <select
              value={selectedSongId}
              onChange={(e) => {
                setSelectedSongId(e.target.value)
                setActiveMediaId(e.target.value)
              }}
              className="w-full appearance-none rounded-xl border border-orange-500/30 bg-black/80 px-4 py-3 font-mono text-sm font-bold text-amber-300 outline-none hover:border-orange-400 focus:border-[#f97316] transition"
            >
              {REAL_DESS_MEDIA.map((m) => (
                <option key={m.id} value={m.id} className="bg-neutral-950 text-white">
                  {m.title} ({m.type.toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-orange-400" />
          </div>
        </div>

        {/* Step 2: How will you use it? */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-300">
              2. How will you use it?
            </label>
            <span className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Direct Master Rights
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[38vh] overflow-y-auto pr-1">
            {REAL_DESS_MASTER_LICENSES.map((lic) => {
              const isSelected = selectedLicenseId === lic.id
              const priceStr = currency === 'KSH' ? formatKshPrice(lic.priceKsh) : `$${lic.priceUsd}`
              return (
                <button
                  key={lic.id}
                  onClick={() => setSelectedLicenseId(lic.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-orange-500/20 border-[#f97316] ring-1 ring-[#f97316] shadow-lg shadow-orange-500/20'
                      : 'bg-black/60 border-orange-950/80 hover:border-orange-500/40 hover:bg-orange-950/20'
                  }`}
                >
                  {lic.recommended && (
                    <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#facc15] to-[#f59e0b] text-black text-[8px] font-black uppercase tracking-wider shadow">
                      POPULAR
                    </span>
                  )}
                  {lic.id === 'kiosk' && (
                    <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-orange-500 text-black text-[8px] font-black uppercase tracking-wider shadow">
                      KSH 100
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-xs font-bold text-white leading-snug">{lic.name}</h3>
                    <span className="font-mono text-xs font-black text-amber-400 whitespace-nowrap ml-1">
                      {priceStr}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-orange-100/70">
                    {lic.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected License Summary & What You Can Do */}
        <div className="mt-4 rounded-xl border border-orange-500/25 bg-black/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-orange-400">
                Selected Usage:
              </span>
              <h4 className="text-sm font-bold text-white">
                {activeLicense.name} — {selectedSong.title}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase tracking-wider text-orange-400">
                License Fee:
              </span>
              <div className="text-base sm:text-lg font-mono font-black text-amber-400">
                {displayPrice}
              </div>
            </div>
          </div>

          {/* Key Rights Included */}
          <div className="space-y-1 pt-1.5 border-t border-orange-950/80">
            <span className="text-[9.5px] font-mono font-bold text-orange-300 uppercase tracking-wider">
              What you can do with this license:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
              {activeLicense.rights.map((right, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10.5px] text-orange-100/85">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{right}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal / Terms Accordion Toggle */}
          <div className="pt-1">
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="text-[10px] font-mono text-orange-300/80 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <Info className="h-3 w-3" />
              <span>{showTerms ? 'Hide License Terms' : 'View Full Master License Terms'}</span>
            </button>

            {showTerms && (
              <div className="mt-2 rounded-lg border border-orange-900/40 bg-[#160a04] p-3 text-[10px] text-orange-200/80 space-y-1.5 font-sans leading-relaxed animate-in fade-in duration-150">
                <p>
                  <strong>Direct Master Sound Recording License:</strong> This license grants non-exclusive master sound recording synchronization and performance rights directly from independent artist Real Des.
                </p>
                <p>
                  <strong>Delivery:</strong> Upon payment verification, you receive uncompressed 24-bit lossless master WAV files, digital authorization certificate, and automatic Content ID clearance.
                </p>
                <p>
                  <strong>Territory & Term:</strong> Worldwide coverage for the licensed scope. For bespoke custom sync arrangements or global broadcast buyouts, contact hello@balaastudios.com.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Interactive Payment Process & Till Confirmation */}
        {isConfirmed ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
              <CheckCircle2 className="h-5 w-5" />
              <span>MASTER LICENSE CLEARED BY ADMIN</span>
            </div>
            <p className="text-xs text-emerald-100/90 font-sans leading-relaxed">
              Your license for <strong>{selectedSong.title}</strong> ({activeLicense.name}) is certified and active! Reference: <strong>{currentOrder?.reference}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 text-black font-mono font-black text-xs uppercase rounded-xl hover:bg-emerald-400 transition"
            >
              Close & View Portfolio
            </button>
          </div>
        ) : currentOrder ? (
          /* Pending Admin Confirmation View */
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-black/80 p-4 space-y-3 font-mono text-xs shadow-lg shadow-amber-500/10 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-orange-950/80 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Clock className="w-4 h-4 animate-spin text-amber-400" />
                PAYMENT PENDING CONFIRMATION
              </span>
              <span className="text-[9px] uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                Awaiting Admin Review
              </span>
            </div>

            <div className="flex justify-between items-center text-orange-200">
              <span>Lipa Na M-Pesa Till:</span>
              <button
                onClick={copyTill}
                className="flex items-center gap-1 font-bold text-amber-400 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
              >
                <span>{MPESA_TILL_NUMBER}</span>
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex justify-between items-center text-orange-200">
              <span>Amount:</span>
              <span className="font-bold text-amber-400">{displayPrice}</span>
            </div>
            <div className="flex justify-between items-center text-orange-200">
              <span>Order Ref:</span>
              <button
                onClick={copyRef}
                className="flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/20 transition"
              >
                <span>{currentOrder.reference}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10.5px] text-orange-200/70 pt-2 border-t border-orange-950/80 font-sans leading-tight">
              Pay via Buy Goods (Till <strong>{MPESA_TILL_NUMBER}</strong>). As soon as management confirms payment on the admin dashboard, your master rights activate instantly.
            </p>
          </div>
        ) : (
          /* Ready to submit */
          <>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-orange-500/20 bg-black/60 p-3 font-mono text-xs text-orange-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Lipa Na M-Pesa Till:</span>
                <button
                  onClick={copyTill}
                  className="flex items-center gap-1 font-black text-amber-400 hover:underline"
                  title="Copy Till Number"
                >
                  <span>{MPESA_TILL_NUMBER}</span>
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
              </div>
              <div className="text-[10px] text-orange-300/80">
                Ref: <span className="text-white font-bold">{selectedSong.title.toUpperCase().slice(0, 10)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] py-3.5 text-center font-mono text-sm font-black uppercase tracking-wider text-[#140a05] shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                'Submitting Order…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>GET {activeLicense.name.toUpperCase()} LICENSE ({displayPrice})</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

