'use client'
import { useState, useMemo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/useAppStore'
import { X, ShoppingBag, Tag, Copy, CheckCircle, Smartphone, Clock, Sparkles, AlertCircle } from 'lucide-react'
import { MPESA_TILL_NUMBER, formatKshPrice } from '@/lib/mpesa-till'
import { useAuth } from '@/context/AuthContext'
import { BalaaOrder } from '@/types/orders'

export const MerchDrawer = () => {
  const { merchDrawerOpen, selectedMerch, setMerchDrawerOpen, setSelectedMerch } = useAppStore(useShallow((s) => ({
    merchDrawerOpen: s.merchDrawerOpen,
    selectedMerch: s.selectedMerch,
    setMerchDrawerOpen: s.setMerchDrawerOpen,
    setSelectedMerch: s.setSelectedMerch,
  })))

  const { user, openAuthModal } = useAuth()
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<BalaaOrder | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Poll for status confirmation when order is pending
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
        console.warn('[MerchDrawer] Order poll error:', e)
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [currentOrder, isConfirmed])

  if (!merchDrawerOpen || !selectedMerch) return null

  const handleStartCheckout = async () => {
    if (!user) {
      openAuthModal('Sign in with Google or Email to place your merch order and track delivery.')
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
          type: 'merch',
          itemId: selectedMerch.id,
          itemTitle: selectedMerch.name,
          amount: selectedMerch.price,
          currency: 'KSH',
          metadata: {
            size: selectedSize || 'Standard',
            image: selectedMerch.image,
          },
        }),
      })
      const data = await res.json()
      if (data.order) {
        setCurrentOrder(data.order)
        setShowPaymentModal(true)
      }
    } catch (err) {
      console.error('[MerchDrawer] Checkout error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const copyRef = () => {
    if (currentOrder?.reference) {
      navigator.clipboard.writeText(currentOrder.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const closeDrawer = () => {
    setMerchDrawerOpen(false)
    setSelectedMerch(null)
    setShowPaymentModal(false)
    setSelectedSize('')
    setCurrentOrder(null)
    setIsConfirmed(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeDrawer}
      />
      <div className="relative w-full max-w-3xl bg-[#0f0906]/95 border border-orange-500/30 rounded-t-2xl sm:rounded-2xl mx-auto mb-0 sm:mb-12 shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between p-4 border-b border-orange-950/80 bg-black/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">BALAA Virtual & Physical Merch</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-lg hover:bg-orange-500/20 text-orange-200/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-h-[80vh] overflow-y-auto">
          <div className="aspect-square rounded-xl overflow-hidden bg-black/80 border border-orange-500/20 flex items-center justify-center">
            <img
              src={selectedMerch.image}
              alt={selectedMerch.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/textures/balaa_logo_white.png'
              }}
            />
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[9.5px] font-mono font-black uppercase tracking-[0.2em] text-[#fbbf24]">
                  OFFICIAL ARTIST MERCHANDISE
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">{selectedMerch.name}</h3>
                <p className="text-xs text-orange-100/70 mt-1 leading-relaxed">{selectedMerch.description}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400 font-mono">{formatKshPrice(selectedMerch.price)}</span>
                {selectedMerch.originalPrice && (
                  <span className="text-sm text-neutral-500 line-through font-mono">{formatKshPrice(selectedMerch.originalPrice)}</span>
                )}
                <Tag className="w-4 h-4 text-orange-400/60" />
              </div>

              {selectedMerch.sizes && selectedMerch.sizes.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-orange-300 font-mono">Select Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMerch.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all
                          ${selectedSize === size
                            ? 'bg-orange-500/25 text-orange-300 border border-[#f97316] shadow-sm'
                            : 'bg-black/60 text-orange-200/70 hover:text-white hover:bg-orange-950/40 border border-orange-950/80'}
                        `}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-orange-950/80 space-y-3">
              {!showPaymentModal ? (
                <button
                  onClick={handleStartCheckout}
                  disabled={submitting || Boolean(!selectedSize && selectedMerch.sizes && selectedMerch.sizes.length > 0)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[#f97316] to-[#fb923c] text-[#140a05] font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Smartphone className="w-4 h-4" />
                  {submitting ? 'Creating Order…' : 'Order via M-Pesa Till'}
                </button>
              ) : isConfirmed ? (
                /* Confirmed State */
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                    <CheckCircle className="w-5 h-5" />
                    <span>PAYMENT CONFIRMED BY ADMIN</span>
                  </div>
                  <p className="text-xs text-emerald-100/90 font-sans leading-relaxed">
                    Thank you! Your order <strong>{currentOrder?.reference}</strong> is confirmed. Our team has received your details and will dispatch your package.
                  </p>
                  <button
                    onClick={closeDrawer}
                    className="w-full py-2 bg-emerald-500 text-black font-mono font-black text-xs uppercase rounded-xl hover:bg-emerald-400 transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Pending State */
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
                    <span>Amount:</span>
                    <span className="font-bold text-amber-400">{formatKshPrice(selectedMerch.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-orange-200">
                    <span>Order Ref:</span>
                    <button
                      onClick={copyRef}
                      className="flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/20 transition"
                    >
                      <span>{currentOrder?.reference}</span>
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[10.5px] text-orange-200/70 leading-tight pt-2 border-t border-orange-950/80 font-sans">
                    Pay via Lipa na M-Pesa → Buy Goods (Till <strong>{MPESA_TILL_NUMBER}</strong>). Management will confirm on the backend and this button will activate.
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-orange-200 text-[10px] uppercase font-bold rounded-lg border border-orange-500/20 transition"
                  >
                    Back to Item Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

