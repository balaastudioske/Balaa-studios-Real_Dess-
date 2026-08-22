'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Trash2, Save } from 'lucide-react'

interface ScheduledEvent {
  id: string
  title: string
  scheduledFor: string
  capacity: number | null
  price: number
}

export default function AdminPage() {
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    scheduledFor: '',
    capacity: '',
    price: '',
  })

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      setEvents(data.events || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleCreateEvent = async () => {
    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEvent.title,
        scheduledFor: newEvent.scheduledFor,
        capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null,
        price: parseInt(newEvent.price),
      }),
    })
    const data = await response.json()
    if (data.event) {
      setShowNewForm(false)
      setNewEvent({ title: '', scheduledFor: '', capacity: '', price: '' })
      fetchEvents()
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  const handleGoLive = async (id: string) => {
    await fetch(`/api/admin/events/${id}/live`, { method: 'POST' })
    fetchEvents()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Manage events and shows</p>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Scheduled Events</h2>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>

        {showNewForm && (
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
            <h3 className="font-medium mb-4">Create New Event</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 rounded-lg text-sm mt-1"
                  placeholder="REAL_DESS Live"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.scheduledFor}
                  onChange={(e) => setNewEvent({ ...newEvent, scheduledFor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Ticket Price (KSh)</label>
                <input
                  type="number"
                  value={newEvent.price}
                  onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 rounded-lg text-sm mt-1"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Capacity (0 for unlimited)</label>
                <input
                  type="number"
                  value={newEvent.capacity}
                  onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 rounded-lg text-sm mt-1"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateEvent}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Create Event
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading events...</div>
        ) : (
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No events scheduled yet.</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.scheduledFor).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        KSh {event.price}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGoLive(event.id)}
                      className="px-3 py-1.5 bg-fuchsia-700 hover:bg-fuchsia-600 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      Go Live
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1.5 rounded hover:bg-red-600/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
