'use client'

import React, { useEffect, useState } from 'react'
import { X, Clock, CheckCircle2, ShoppingBag, Music, Sparkles, RefreshCw, Copy, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BalaaOrder } from '@/types/orders'
import { MPESA_TILL_NUMBER, formatKshPrice } from '@/lib/mpesa-till'

interface UserOrdersModalProps {
  onClose: () => void
}

export function UserOrdersModal({ onClose }: UserOrdersModalProps) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<BalaaOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?userEmail=${encodeURIComponent(user.email || '')}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error('[UserOrdersModal] Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!user) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      aria-label="My Orders and Licenses"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-orange-500/30 bg-[#0f0906]/95 p-6 text-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 font-sans max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-950/80 pb-4 shrink-0">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#fbbf24]">
              ACCOUNT PORTFOLIO
            </span>
            <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
              My Orders & Master Clearances
            </h2>
            <p className="text-xs text-orange-200/60 font-mono mt-0.5">{user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="rounded-lg p-2 text-orange-200/70 hover:bg-orange-500/20 hover:text-white transition"
              title="Refresh Orders"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-orange-200/70 hover:bg-orange-500/20 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {loading && orders.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-orange-200/60">
              Fetching your orders and clearances…
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ShoppingBag className="mx-auto h-8 w-8 text-orange-400/40" />
              <p className="text-sm font-bold text-white">No transactions yet</p>
              <p className="text-xs text-orange-200/60 font-sans max-w-sm mx-auto">
                Explore the BALAA 3D catalog to purchase exclusive merchandise, license master sound recordings, or book creative sessions.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isPending = order.status === 'pending'
              const isConfirmed = order.status === 'confirmed'
              const priceDisplay = order.currency === 'KSH' ? formatKshPrice(order.amount) : `$${order.amount}`

              return (
                <div
                  key={order.id}
                  className="rounded-xl border p-4 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="rounded-xl p-2.5 shrink-0"
                      >
                        {order.type === 'license' ? (
                          <Music className="h-5 w-5" />
                        ) : (
                          <ShoppingBag className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300">
                            {order.type.toUpperCase()}
                          </span>
                          <span className="text-slate-500 text-xs">•</span>
                          <span className="text-[11px] font-mono text-orange-200/70">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">{order.itemTitle}</h4>
                        {order.metadata?.size && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-orange-200/80 bg-black/60 px-2 py-0.5 rounded border border-orange-500/20">
                            Size: {order.metadata.size}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-black text-amber-400">
                        {priceDisplay}
                      </div>
                      <span
                        className="inline-flex items-center gap-1 mt-1 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider"
                      >
                        {isPending && <Clock className="h-3 w-3" />}
                        {isConfirmed && <CheckCircle2 className="h-3 w-3" />}
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Pending M-Pesa Instructions Box */}
                  {isPending && (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-black/60 p-3 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-orange-200/90">
                        <span>Lipa Na M-Pesa Till:</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {MPESA_TILL_NUMBER}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-orange-200/90">
                        <span>Order Reference:</span>
                        <button
                          onClick={() => copyText(order.reference, order.id)}
                          className="flex items-center gap-1 font-bold text-amber-400 hover:underline bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                        >
                          <span>{order.reference}</span>
                          {copiedId === order.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-300/80 pt-1 border-t border-orange-950/60 font-sans leading-tight">
                        Awaiting manual till verification by administration. Once verified, this card will automatically activate.
                      </p>
                    </div>
                  )}

                  {/* Confirmed License Actions */}
                  {isConfirmed && order.type === 'license' && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-[11px] font-mono text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        Master Recording License Active
                      </span>
                      <span className="font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded">
                        CERTIFIED
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
