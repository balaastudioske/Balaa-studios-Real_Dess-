'use client'

import { Heart, Mail, Sparkles, Compass, User, X, LogIn, LogOut, PackageCheck, ChevronDown, CheckCircle2, Copy, Clock, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { REAL_DESS_SERVICES, REAL_DESS_MEDIA, type BalaaStageMode, type CreativeService } from '@/lib/balaa-catalog'
import { MPESA_TILL_NUMBER, formatKshPrice } from '@/lib/mpesa-till'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/context/AuthContext'
import { UserOrdersModal } from '@/components/ui/UserOrdersModal'
import { BalaaOrder } from '@/types/orders'

interface BalaaStageInterfaceProps {
  activeMode: BalaaStageMode
  onSetMode: (mode: BalaaStageMode) => void
}

/** HTML is deliberately limited to controls; video imagery lives on the physical R3F screen. */
export function BalaaStageInterface({ activeMode, onSetMode }: BalaaStageInterfaceProps) {
  const { user, openAuthModal, signOut } = useAuth()
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const activeMediaId = useAppStore((s) => s.activeMediaId)
  const setActiveMediaId = useAppStore((s) => s.setActiveMediaId)
  const triggerCameraReset = useAppStore((s) => s.triggerCameraReset)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const setCameraMode = useAppStore((s) => s.setCameraMode)

  const [catalogOpen, setCatalogOpen] = useState(false)
  const nav: BalaaStageMode[] = ['catalog', 'wardrobe', 'licensing', 'services', 'support']

  const handleNavClick = (mode: BalaaStageMode) => {
    onSetMode(mode)
    setCameraMode('artist')
    triggerCameraReset()
  }

  const handleArtistCamera = () => {
    setCameraMode('artist')
    triggerCameraReset()
  }

  const handleExploreCamera = () => {
    setCameraMode('explore')
  }

  return (
    <>
      {/* 1. Primary Navigation Bar + User Account */}
      <section
        className="balaa-primary-nav pointer-events-auto absolute left-1/2 top-4 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 p-1.5 rounded-2xl border border-orange-500/25 bg-black/80 backdrop-blur-xl shadow-2xl"
        aria-label="BALAA primary navigation"
      >
        {nav.map((mode) => (
          <button
            key={mode}
            onClick={() => handleNavClick(mode)}
            className={`balaa-nav-button capitalize font-mono text-xs px-3.5 py-1.5 rounded-xl transition ${
              activeMode === mode
                ? 'balaa-nav-button-active bg-[#f97316] text-[#140a05] font-black shadow-lg shadow-orange-500/25'
                : 'text-orange-200/80 hover:text-white hover:bg-orange-500/15'
            }`}
          >
            {mode === 'licensing' ? 'License Music' : mode}
          </button>
        ))}

        <div className="h-4 w-[1px] bg-orange-500/30 mx-1 hidden sm:block" />

        {/* User Account / Sign In Indicator */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/15 px-2.5 py-1.5 font-mono text-xs font-bold text-orange-300 hover:border-orange-400 hover:text-white transition"
              title={user.email || 'My Account'}
            >
              <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-[10px] text-black font-black flex items-center justify-center">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-orange-500/30 bg-[#0f0906]/95 p-1.5 text-xs text-white shadow-2xl backdrop-blur-xl font-mono animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="px-3 py-2 border-b border-orange-950/80 text-[10px] text-orange-200/70 truncate">
                  {user.email}
                </div>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    setShowOrdersModal(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-orange-500/20 text-orange-200 hover:text-white transition"
                >
                  <PackageCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>My Orders & Licenses</span>
                </button>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    signOut()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-red-500/20 text-red-300 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('Sign in with Google or Email to unlock master tracks, orders, and VIP events.')}
            className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-gradient-to-r from-[#f97316]/20 to-[#fb923c]/20 px-3 py-1.5 font-mono text-xs font-bold text-amber-300 hover:border-orange-400 hover:text-white transition"
          >
            <LogIn className="h-3.5 w-3.5 text-orange-400" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </section>

      {/* Customer Orders / Licenses Portfolio Modal */}
      {showOrdersModal && <UserOrdersModal onClose={() => setShowOrdersModal(false)} />}

      {/* 2. Media Catalog Drawer */}
      {activeMode === 'catalog' && catalogOpen && (
        <section className="balaa-panel balaa-media-catalog pointer-events-auto absolute bottom-20 left-4 z-30 max-h-[44vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto p-2.5 rounded-2xl border border-orange-500/30 bg-[#0f0906]/95 backdrop-blur-xl shadow-2xl">
          <p className="mb-2 px-2 pt-1 text-[10px] font-mono font-black uppercase tracking-[.18em] text-[#fbbf24]">
            Performance Videos • {REAL_DESS_MEDIA.length} Songs
          </p>
          {REAL_DESS_MEDIA.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMediaId(item.id)
                setCatalogOpen(false)
              }}
              className={`mb-1 flex w-full items-center gap-2.5 rounded-xl border p-2 text-left text-xs transition ${
                item.id === activeMediaId
                  ? 'border-[#fb923c] bg-[#f97316] text-[#140a05] font-black'
                  : 'border-orange-950/40 text-slate-100 hover:border-orange-400/40 hover:bg-orange-500/15'
              }`}
            >
              <img
                className="h-10 w-14 rounded-lg object-cover shrink-0"
                src={`https://i.ytimg.com/vi/${item.youtubeVideoId}/default.jpg`}
                alt=""
              />
              <div className="truncate">
                <p className="truncate font-bold leading-tight">{item.title}</p>
                <span className="text-[9px] uppercase font-mono opacity-80">{item.type}</span>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* 3. Services / Support Panels */}
      {(activeMode === 'services' || activeMode === 'support') && (
        <BalaaPanel mode={activeMode} onClose={() => onSetMode('catalog')} />
      )}

      {/* 4. Bottom-Left Utility Dock: Videos + Camera Mode Controls [ ARTIST ] [ EXPLORE ] */}
      <div className="balaa-utility-dock pointer-events-auto absolute bottom-4 left-4 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl border border-orange-500/30 bg-black/80 backdrop-blur-xl shadow-2xl font-mono text-[11px]">
        <button
          onClick={() => {
            onSetMode('catalog')
            setCatalogOpen((open) => !open)
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            catalogOpen
              ? 'bg-[#f97316] text-[#140a05] font-black'
              : 'text-orange-200/80 hover:text-white hover:bg-orange-500/15'
          }`}
          title="Browse REAL_DESS Songs & Videos"
        >
          <span>Songs</span>
        </button>

        <div className="h-4 w-[1px] bg-orange-500/30" />

        {/* ARTIST View Button */}
        <button
          onClick={handleArtistCamera}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            cameraMode === 'artist'
              ? 'bg-[#f97316] text-[#140a05] font-black shadow-md shadow-orange-500/30'
              : 'text-orange-200/80 hover:text-white hover:bg-orange-500/15'
          }`}
          title="Return camera to front Artist view"
        >
          <User className="h-3.5 w-3.5" />
          <span>ARTIST</span>
        </button>

        {/* EXPLORE View Button */}
        <button
          onClick={handleExploreCamera}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            cameraMode === 'explore'
              ? 'bg-[#facc15] text-[#140a05] font-black shadow-md shadow-amber-500/30'
              : 'text-orange-200/80 hover:text-white hover:bg-orange-500/15'
          }`}
          title="Enable 3D orbit and space environment exploration"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>EXPLORE</span>
        </button>
      </div>

      {/* 5. Footer */}
      <footer className="balaa-footer pointer-events-auto absolute bottom-4 right-4 z-30 flex gap-1 p-1.5 rounded-xl border border-orange-500/20 bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-orange-200/80">
        <a className="rounded-lg px-2.5 py-1 hover:bg-orange-500/20 hover:text-white transition" href="mailto:hello@balaastudios.com">
          <Mail className="mr-1 inline h-3 w-3" />
          Contact
        </a>
        <a className="rounded-lg px-2.5 py-1 hover:bg-orange-500/20 hover:text-white transition" href="/privacy">
          Privacy
        </a>
        <a className="rounded-lg px-2.5 py-1 hover:bg-orange-500/20 hover:text-white transition" href="/terms">
          Terms
        </a>
      </footer>
    </>
  )
}

function BalaaPanel({ mode, onClose }: { mode: 'services' | 'support'; onClose: () => void }) {
  const { user, openAuthModal } = useAuth()
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0)
  const [currency, setCurrency] = useState<'KSH' | 'USD'>('KSH')
  const [copied, setCopied] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<BalaaOrder | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pledgeAmount, setPledgeAmount] = useState(500)

  const service = REAL_DESS_SERVICES[selectedServiceIndex] || REAL_DESS_SERVICES[0]

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
        console.warn('[BalaaPanel] Order poll error:', e)
      }
    }, 3500)
    return () => clearInterval(interval)
  }, [currentOrder, isConfirmed])

  const submitOrder = async (payload: {
    type: 'service' | 'support'
    itemId: string
    itemTitle: string
    amount: number
    currency: 'KSH' | 'USD'
    metadata?: Record<string, any>
  }) => {
    if (!user) {
      openAuthModal('Sign in with Google or Email to submit your BALAA order and track till confirmation.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || '',
          ...payload,
        }),
      })
      const data = await res.json()
      if (data.order) setCurrentOrder(data.order)
    } catch (e) {
      console.error('[BalaaPanel] Order error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const copyTill = () => {
    navigator.clipboard?.writeText(MPESA_TILL_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="balaa-panel pointer-events-auto absolute bottom-16 left-1/2 z-40 w-[min(94vw,520px)] -translate-x-1/2 rounded-2xl border border-orange-500/30 bg-[#0f0906]/95 p-5 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-orange-200/70 hover:bg-orange-500/20 hover:text-white transition"
        aria-label="Close panel"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-orange-950/80 pb-3">
        <div className="flex items-center gap-2 text-amber-400">
          {mode === 'support' ? (
            <Heart className="h-5 w-5 fill-[#f97316] text-[#f97316]" />
          ) : (
            <Sparkles className="h-5 w-5 text-orange-400" />
          )}
          <span className="font-mono text-[10px] font-black uppercase tracking-[.18em]">
            {mode === 'support' ? 'ARTIST BACKING • REAL DESS' : 'CREATIVE SERVICES & BOOKINGS'}
          </span>
        </div>

        {mode === 'services' && (
          <div className="flex items-center rounded-lg border border-orange-500/30 bg-black/60 p-0.5 font-mono text-[9px] mr-7">
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
        )}
      </div>

      {mode === 'services' ? (
        <div className="mt-3 space-y-3">
          {/* Service Selector Pills */}
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {REAL_DESS_SERVICES.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceIndex(index)}
                className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold transition ${
                  index === selectedServiceIndex
                    ? 'border-[#f97316] bg-[#f97316] text-[#140a05] shadow-md shadow-orange-500/20'
                    : 'border-orange-950/80 bg-black/40 text-orange-100/80 hover:border-orange-400/50 hover:bg-orange-500/15'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Service Detail Card */}
          <div className="rounded-xl border border-orange-500/20 bg-neutral-950/80 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  {service.name}
                </h3>
                <p className="font-mono text-[10px] text-orange-400 font-bold uppercase">
                  {service.unit}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-black text-amber-400">
                  {currency === 'KSH' ? `From ${formatKshPrice(service.priceKsh)}` : `From $${service.priceUsd}`}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-orange-100/80 font-sans">
              {service.description}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-orange-950/80">
              <span className="font-mono text-[9.5px] font-bold text-orange-400 uppercase tracking-wider">
                INCLUDED DELIVERABLES:
              </span>
              {service.deliverables.map((del, i) => (
                <p key={i} className="text-[11px] text-slate-200 flex items-center gap-1.5 font-sans">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  {del}
                </p>
              ))}
            </div>
          </div>

          {/* M-Pesa & Direct Booking */}
          <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-black/60 px-3.5 py-2.5 font-mono text-xs">
            <span className="text-orange-200/80">M-Pesa Buy Goods Till:</span>
            <button
              onClick={copyTill}
              className="flex items-center gap-1 font-bold text-amber-400 hover:underline"
            >
              <span>{MPESA_TILL_NUMBER}</span>
              <span className="text-[10px] text-orange-400">({copied ? 'Copied!' : 'Copy'})</span>
            </button>
          </div>

           {currentOrder ? (
             <OrderPendingCard
               order={currentOrder}
               isConfirmed={isConfirmed}
               onReset={() => {
                 setCurrentOrder(null)
                 setIsConfirmed(false)
               }}
             />
           ) : (
             <button
               onClick={() =>
                 submitOrder({
                   type: 'service',
                   itemId: service.id,
                   itemTitle: service.name,
                   amount: currency === 'KSH' ? service.priceKsh : service.priceUsd,
                   currency,
                   metadata: { serviceId: service.id, serviceName: service.name },
                 })
               }
               disabled={submitting}
               className="w-full rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] py-3.5 text-center font-mono text-xs font-black uppercase tracking-wider text-[#140a05] shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
             >
               {submitting ? 'Creating Order…' : `Book ${service.name}`}
             </button>
           )}
        </div>
      ) : (
        /* Support Mode — Open Community Donation */
        <div className="mt-3 space-y-3">
          <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
            <span>Fuel Independent African Artistry</span>
          </h2>
          <p className="text-xs leading-relaxed text-orange-100/80 font-sans">
            Direct community backing powers 3D motion capture animation, Dolby Atmos engineering, raw studio production, and free virtual live performances for REAL_DESS.
          </p>

          {/* Massive Prominent Till Banner */}
          <div className="p-4 rounded-2xl border-2 border-orange-500/60 bg-gradient-to-br from-orange-500/20 via-black to-amber-500/10 text-center shadow-[0_0_30px_rgba(249,115,22,0.25)] space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">
              Safaricom M-Pesa Buy Goods Till
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-widest font-mono select-all drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]">
              {MPESA_TILL_NUMBER}
            </div>
            <p className="text-[10px] text-orange-200/80">Merchant: BALAA STUDIOS</p>
            <button
              onClick={copyTill}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase text-[10px] tracking-wider transition active:scale-95 shadow-md shadow-orange-500/30"
            >
              {copied ? 'TILL COPIED TO CLIPBOARD!' : 'COPY TILL NUMBER'}
            </button>
          </div>

          {/* Open Custom Donation Amount */}
          <div className="rounded-xl border border-orange-500/20 bg-neutral-950/80 p-3 space-y-2 font-mono text-xs">
            <label className="text-[10.5px] font-bold text-orange-300 uppercase tracking-wider block">
              Enter Custom Contribution (KSh):
            </label>
            <input
              type="number"
              min="10"
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(Math.max(1, Number(e.target.value) || 0))}
              placeholder="Enter any amount..."
              className="w-full bg-neutral-900 border border-orange-500/30 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {currentOrder ? (
            <OrderPendingCard
              order={currentOrder}
              isConfirmed={isConfirmed}
              onReset={() => {
                setCurrentOrder(null)
                setIsConfirmed(false)
              }}
            />
          ) : (
            <button
              onClick={() =>
                submitOrder({
                  type: 'support',
                  itemId: 'artist-support',
                  itemTitle: 'Artist Backing — REAL_DESS',
                  amount: pledgeAmount,
                  currency: 'KSH',
                  metadata: { notes: `Pledge of KSh ${pledgeAmount}` },
                })
              }
              disabled={submitting || pledgeAmount <= 0}
              className="w-full rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] py-3.5 text-center font-mono text-xs font-black uppercase tracking-wider text-[#140a05] shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : `Support REAL_DESS with KSh ${pledgeAmount}`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function OrderPendingCard({
  order,
  isConfirmed,
  onReset,
}: {
  order: BalaaOrder
  isConfirmed: boolean
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyRef = () => {
    if (order.reference) {
      navigator.clipboard?.writeText(order.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isConfirmed) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3 animate-in fade-in">
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
          <CheckCircle2 className="h-5 w-5" />
          <span>PAYMENT CONFIRMED BY ADMIN</span>
        </div>
        <p className="text-xs text-emerald-100/90 font-sans leading-relaxed">
          Thank you! Your order <strong>{order.reference}</strong> is confirmed. Management has received your details.
        </p>
        <button
          onClick={onReset}
          className="w-full py-2 bg-emerald-500 text-black font-mono font-black text-xs uppercase rounded-xl hover:bg-emerald-400 transition"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="bg-black/80 border border-amber-500/40 rounded-xl p-4 space-y-3 font-mono text-xs shadow-lg shadow-amber-500/10 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-orange-950/80 pb-2">
        <span className="flex items-center gap-1.5 font-bold text-amber-300">
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          PAYMENT PENDING
        </span>
        <span className="text-[9px] uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
          Awaiting Verification
        </span>
      </div>

      <div className="flex justify-between items-center text-orange-200">
        <span>Till Number:</span>
        <span className="font-bold text-white text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-orange-500/30">
          {MPESA_TILL_NUMBER}
        </span>
      </div>
      <div className="flex justify-between items-center text-orange-200">
        <span>Order Ref:</span>
        <button
          onClick={copyRef}
          className="flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/20 transition"
        >
          <span>{order.reference}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[10.5px] text-orange-200/70 leading-tight pt-2 border-t border-orange-950/80 font-sans">
        Pay via Lipa na M-Pesa → Buy Goods (Till <strong>{MPESA_TILL_NUMBER}</strong>). Management will confirm on the backend and this will activate automatically.
      </p>
      <button
        onClick={onReset}
        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-orange-200 text-[10px] uppercase font-bold rounded-lg border border-orange-500/20 transition"
      >
        Back
      </button>
    </div>
  )
}
