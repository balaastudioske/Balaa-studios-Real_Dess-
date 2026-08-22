import { NextRequest, NextResponse } from 'next/server'
import { adminSessionCookie, validateAdminPassword } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: '' }))
  if (typeof password !== 'string' || !validateAdminPassword(password)) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  const response = NextResponse.json({ ok: true })
  const session = adminSessionCookie()
  response.cookies.set(session.name, session.value, session.options)
  return response
}
