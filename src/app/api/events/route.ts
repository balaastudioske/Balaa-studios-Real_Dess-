import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession, unauthorized } from '@/lib/admin-auth'

export async function GET() {
  const events = [
    {
      id: 'evt_1',
      title: 'REAL_DESS Live',
      scheduledFor: '2026-08-15T21:00:00',
      capacity: 100,
      price: 10,
    },
  ]

  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession())) return unauthorized()
  const body = await request.json()
  const { title, scheduledFor, capacity, price } = body

  return NextResponse.json({
    event: {
      id: `evt_${Date.now()}`,
      title,
      scheduledFor,
      capacity: capacity || null,
      price,
    },
  })
}
