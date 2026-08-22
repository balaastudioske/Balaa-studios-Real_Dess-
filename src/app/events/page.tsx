'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, CheckCircle, Copy, ArrowLeft } from 'lucide-react'
import { MPESA_TILL_NUMBER, MPESA_INSTRUCTIONS, generateOrderReference, formatKshPrice } from '@/lib/mpesa-till'
import Link from 'next/link'

interface ScheduledEvent {
  id: string
  title: string
  scheduledFor: string
  capacity: number | null
  price: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null)
  const [orderReference, setOrderReference] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelectEvent = (event: ScheduledEvent) => {
    setSelectedEvent(event)
    setOrderReference(generateOrderReference())
    setCopied(false)
  }

  const copyRef = () => {
    if (orderReference) {
      navigator.clipboard.writeText(orderReference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio
            </Link>
          </div>
          <h1 className="text-2xl font-bold mt-1">BALAA Live Show Schedule</h1>
          <p className="text-xs text-slate-400 font-mono">Official hosted performance sessions</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
          M-Pesa Till: <span className="text-orange-400 font-bold">{MPESA_TILL_NUMBER}</span>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-mono text-sm">Loading event schedule...</div>
        ) : (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                <p className="text-slate-400 text-sm">No scheduled events right now. Live stage is always active in studio.</p>
                <Link href="/" className="mt-4 inline-block px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-bold uppercase tracking-wider text-black">
                  Enter 3D Stage
                </Link>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-orange-500/40 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDate(event.scheduledFor)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          {event.capacity ? `${event.capacity} Capacity` : 'Open Access'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="font-bold text-orange-400 text-lg">{formatKshPrice(event.price)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Ticket pass</div>
                    </div>
                    <button
                      onClick={() => handleSelectEvent(event)}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-600/20"
                    >
                      Get Pass
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Manual M-Pesa Till Instruction Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">Manual M-Pesa Payment</span>
                <h3 className="text-xl font-bold text-slate-100 mt-0.5">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/50 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Amount:</span>
                <span className="text-base font-bold text-orange-400">{formatKshPrice(selectedEvent.price)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Buy Goods Till Number:</span>
                <span className="font-bold text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{MPESA_TILL_NUMBER}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                <span>Order Reference:</span>
                <button
                  onClick={copyRef}
                  className="flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/20 transition"
                >
                  <span>{orderReference}</span>
                  {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Steps:</div>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                {MPESA_INSTRUCTIONS.map((step, idx) => (
                  <li key={idx} className="leading-relaxed text-slate-300">{step}</li>
                ))}
              </ol>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}