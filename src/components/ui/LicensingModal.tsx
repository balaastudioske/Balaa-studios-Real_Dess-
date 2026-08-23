'use client'

import React, { useState, useEffect } from 'react'
import { Music, ShieldCheck, Check, ArrowRight, X, Sparkles, Copy, ChevronDown, Info, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react'
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

  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([activeMediaId || REAL_DESS_MEDIA[0].id])
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('creator')
  const [currency, setCurrency] = useState<'KSH' | 'USD'>('KSH')
  const [showTerms, setShowTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<BalaaOrder | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeLicense = REAL_DESS_MASTER_LICENSES.find((l) => l.id === selectedLicenseId) || REAL_DESS_MASTER_LICENSES[0]

  const unitAmount = currency === 'KSH' ? activeLicense.priceKsh : activeLicense.priceUsd
  const totalAmount = unitAmount * selectedTrackIds.length
  const displayTotalPrice = currency === 'KSH' ? formatKshPrice(totalAmount) : `$${totalAmount}`
  const displayUnitPrice = currency === 'KSH' ? formatKshPrice(unitAmount) : `$${unitAmount}`

  const toggleTrack = (id: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((t) => t !== id)
          : prev
        : [...prev, id]
    )
  }

  const selectAllTracks = () => {
    if (selectedTrackIds.length === REAL_DESS_MEDIA.length) {
      setSelectedTrackIds([activeMediaId || REAL_DESS_MEDIA[0].id])
    } else {
      setSelectedTrackIds(REAL_DESS_MEDIA.map((m) => m.id))
    }
  }

  // Poll for payment confirmation
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
      openAuthModal('Sign in with Google or Email to license tracks and generate master clearance.')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedTracks = REAL_DESS_MEDIA.filter((m) => selectedTrackIds.includes(m.id))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || '',
          type: 'license',
          itemId: activeLicense.id,
          itemTitle: `${activeLicense.name} (${selectedTrackIds.length} Tracks) — REAL_DESS`,
          amount: totalAmount,
          currency,
          metadata: {
            tracks: selectedTracks.map((t) => ({ id: t.id, title: t.title })),
            trackCount: selectedTrackIds.length,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      aria-label="License REAL_DESS Songs"
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-orange-500/30 bg-[#0c0806]/95 p-6 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 my-auto">
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
                License REAL_DESS Tracks
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="flex items-center rounded-lg border border-orange-500/30 bg-black/60 p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setCurrency('USD')}
                className={`rounded px-2.5 py-1 font-bold transition ${
                  currency === 'USD' ? 'bg-[#f97316] text-[#140a05]' : 'text-orange-200/70 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('KSH')}
                className={`rounded px-2.5 py-1 font-bold transition ${
                  currency === 'KSH' ? 'bg-[#f97316] text-[#140a05]' : 'text-orange-200/70 hover:text-white'
                }`}
              >
                KSh
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

        {/* Step 1: Select Tracks from Catalogue */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-300">
              1. Select Tracks from Catalogue ({selectedTrackIds.length} selected)
            </label>
            <button
              onClick={selectAllTracks}
              className="text-[10px] font-mono text-orange-400 hover:text-amber-300 underline"
            >
              {selectedTrackIds.length === REAL_DESS_MEDIA.length ? 'Reset Selection' : 'Select All Tracks'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[22vh] overflow-y-auto pr-1">
            {REAL_DESS_MEDIA.map((track) => {
              const isSelected = selectedTrackIds.includes(track.id)
              return (
                <button
                  key={track.id}
                  onClick={() => toggleTrack(track.id)}
                  className={`p-2.5 rounded-xl border text-left font-mono text-xs transition flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-white/10 bg-black/50 text-slate-400 hover:border-white/25 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate font-bold text-[11px]">{track.title}</span>
                  <div
                    className={`h-4 w-4 rounded-full shrink-0 flex items-center justify-center border ${
                      isSelected ? 'border-orange-400 bg-orange-500 text-black' : 'border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Choose Licensing Tier */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-300">
              2. Choose License Tier
            </label>
            <span className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Direct Master Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {REAL_DESS_MASTER_LICENSES.map((lic) => {
              const isSelected = selectedLicenseId === lic.id
              const priceStr = currency === 'KSH' ? formatKshPrice(lic.priceKsh) : `$${lic.priceUsd}`
              return (
                <button
                  key={lic.id}
                  onClick={() => setSelectedLicenseId(lic.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-500/20 border-[#f97316] ring-1 ring-[#f97316] shadow-lg shadow-orange-500/20'
                      : 'bg-black/60 border-orange-950/80 hover:border-orange-500/40 hover:bg-orange-950/20'
                  }`}
                >
                  {lic.badge && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#facc15] to-[#f59e0b] text-black text-[8px] font-black uppercase tracking-wider shadow">
                      {lic.badge}
                    </span>
                  )}
                  {lic.popular && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-orange-500 text-black text-[8px] font-black uppercase tracking-wider shadow">
                      POPULAR
                    </span>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-white leading-snug">{lic.name}</h3>
                    <p className="font-mono text-sm font-black text-amber-400 mt-0.5">
                      {priceStr}
                      <span className="text-[9px] text-slate-400 font-normal"> / track</span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-orange-100/70">
                      {lic.description}
                    </p>
                  </div>
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
                Cart Summary:
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                {selectedTrackIds.length} Track(s) × {activeLicense.name} ({displayUnitPrice})
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase tracking-wider text-orange-400">
                Total License Fee:
              </span>
              <div className="text-base sm:text-lg font-mono font-black text-amber-400">
                {displayTotalPrice}
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
                <div key={idx} className="flex items-center gap-1.5 text-[10px] text-orange-100/85">
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
              <span>{showTerms ? 'Hide License Terms' : 'View Master License Terms'}</span>
            </button>

            {showTerms && (
              <div className="mt-2 rounded-lg border border-orange-900/40 bg-[#160a04] p-3 text-[10px] text-orange-200/80 space-y-1.5 font-sans leading-relaxed animate-in fade-in duration-150">
                <p>
                  <strong>Direct Master Sound Recording License:</strong> Grants non-exclusive synchronization and performance rights directly from independent artist REAL_DESS.
                </p>
                <p>
                  <strong>Delivery:</strong> Lossless 24-bit WAV files, authorization certificates, and instant Content ID whitelist.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Process & Till Confirmation */}
        {isConfirmed ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
              <CheckCircle2 className="h-5 w-5" />
              <span>MASTER LICENSE CLEARED BY ADMIN</span>
            </div>
            <p className="text-xs text-emerald-100/90 font-sans leading-relaxed">
              Your license for <strong>{selectedTrackIds.length} track(s)</strong> ({activeLicense.name}) is certified and active! Reference: <strong>{currentOrder?.reference}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 text-black font-mono font-black text-xs uppercase rounded-xl hover:bg-emerald-400 transition"
            >
              Close & View Portfolio
            </button>
          </div>
        ) : currentOrder ? (
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
              <span>Total Amount:</span>
              <span className="font-bold text-amber-400">{displayTotalPrice}</span>
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
                Cart: <span className="text-white font-bold">{selectedTrackIds.length} Selected</span>
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
                  <ShoppingBag className="h-4 w-4" />
                  <span>LICENSE {selectedTrackIds.length} TRACKS ({displayTotalPrice})</span>
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


