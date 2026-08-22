import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession, unauthorized } from '@/lib/admin-auth'

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
