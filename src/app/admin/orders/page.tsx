'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, XCircle, Clock, ShoppingBag, Music, Sparkles, Heart, Download, RefreshCw, Mail } from 'lucide-react'
import { BalaaOrder, NewsletterSubscriber } from '@/types/orders'
import { MPESA_TILL_NUMBER, formatKshPrice } from '@/lib/mpesa-till'

type CategoryFilter = 'all' | 'merch' | 'license' | 'service' | 'support'
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled'

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  merch: 'Merch',
  license: 'Song Licenses',
  service: 'Creative Services',
  support: 'Artist Support',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<BalaaOrder[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showSubscribers, setShowSubscribers] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      console.error('[AdminOrders] Failed to load orders:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/newsletter')
      const data = await res.json()
      setSubscribers(data.subscribers || [])
    } catch (e) {
      console.error('[AdminOrders] Failed to load subscribers:', e)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchSubscribers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (category !== 'all' && o.type !== category) return false
      if (status !== 'all' && o.status !== status) return false
      return true
    })
  }, [orders, category, status])

  const updateOrder = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/orders/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus, confirmedAt: data.confirmedAt } : o))
        )
      }
    } catch (e) {
      console.error('[AdminOrders] Update failed:', e)
    } finally {
      setUpdatingId(null)
    }
  }

  const exportSubscribers = () => {
    const csv = ['email,source,status,createdAt']
      .concat(subscribers.map((s) => `${s.email},${s.source},${s.status},${s.createdAt}`))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'balaa-newsletter-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const o of orders) counts[o.type] = (counts[o.type] || 0) + 1
    return counts
  }, [orders])

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Orders & Master Licenses</h2>
          <p className="text-sm text-orange-200/60 mt-1">
            Manual M-Pesa Till <span className="font-mono font-bold text-amber-400">{MPESA_TILL_NUMBER}</span> confirmation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSubscribers((v) => !v)}
            className="px-3 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 text-xs font-mono flex items-center gap-2 transition"
          >
            <Mail className="w-3.5 h-3.5" />
            Subscribers ({subscribers.length})
          </button>
          <button
            onClick={fetchOrders}
            className="px-3 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 text-xs font-mono flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Subscribers Panel */}
      {showSubscribers && (
        <div className="mb-6 rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-orange-200">Newsletter Subscribers ({subscribers.length})</h3>
            <button
              onClick={exportSubscribers}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-orange-950/60 bg-black/40">
            {subscribers.length === 0 ? (
              <p className="p-4 text-xs text-orange-200/50">No subscribers yet.</p>
            ) : (
              subscribers.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2 border-b border-orange-950/40 text-xs font-mono">
                  <span className="text-orange-100">{s.email}</span>
                  <span className="text-orange-300/70">{s.source}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                category === c
                  ? 'bg-orange-500 text-[#140a05]'
                  : 'bg-black/40 border border-orange-950/80 text-orange-200/80 hover:text-white'
              }`}
            >
              {CATEGORY_LABELS[c]} {categoryCounts[c] ? `(${categoryCounts[c]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {(['all', 'pending', 'confirmed', 'cancelled'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition ${
                status === s
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/40 border border-orange-950/80 text-orange-200/60 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-orange-200/50">Loading orders…</div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center py-12 text-orange-200/50">No orders match this filter.</p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <div key={o.id} className="rounded-xl border border-orange-500/20 bg-[#0f0906]/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="rounded-xl p-2.5 bg-orange-500/10 text-orange-400 shrink-0">
                    {o.type === 'license' ? (
                      <Music className="h-5 w-5" />
                    ) : o.type === 'service' ? (
                      <Sparkles className="h-5 w-5" />
                    ) : o.type === 'support' ? (
                      <Heart className="h-5 w-5" />
                    ) : (
                      <ShoppingBag className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300">
                        {o.type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${STATUS_BADGE[o.status]}`}
                      >
                        {o.status === 'pending' && <Clock className="h-3 w-3" />}
                        {o.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                        {o.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                        {o.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5 truncate">{o.itemTitle}</h4>
                    <p className="text-xs text-orange-200/70 font-mono mt-0.5">{o.userEmail}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-orange-200/60">
                      <span>Ref: <span className="text-amber-400 font-bold">{o.reference}</span></span>
                      <span>
                        {o.currency === 'KSH' ? formatKshPrice(o.amount) : `$${o.amount}`}
                      </span>
                      <span>{new Date(o.createdAt).toLocaleString()}</span>
                    </div>
                    {o.metadata?.size && (
                      <span className="inline-block mt-1 text-[10px] font-mono text-orange-200/80 bg-black/60 px-2 py-0.5 rounded border border-orange-500/20">
                        Size: {o.metadata.size}
                      </span>
                    )}
                  </div>
                </div>

                {o.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      disabled={updatingId === o.id}
                      onClick={() => updateOrder(o.id, 'confirmed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Payment
                    </button>
                    <button
                      disabled={updatingId === o.id}
                      onClick={() => updateOrder(o.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Order
                    </button>
                  </div>
                )}
                {o.status === 'confirmed' && (
                  <span className="text-[10px] font-mono text-emerald-300/80 shrink-0">
                    Cleared
                    {o.confirmedAt ? ` ${new Date(o.confirmedAt).toLocaleDateString()}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
