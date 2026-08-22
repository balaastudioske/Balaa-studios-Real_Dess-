import 'server-only'

import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE = 'balaa_admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 12

function secret() {
  return process.env.ADMIN_SESSION_SECRET || 'balaa_studio_admin_session_secret_2026_auth'
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf-8')
    const bufB = Buffer.from(b, 'utf-8')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export function validateAdminPassword(candidate: string) {
  const cleanCandidate = (candidate || '').trim()
  if (!cleanCandidate) return false

  const configuredPassword = (process.env.ADMIN_PASSWORD || '').trim()
  if (!configuredPassword) return false

  return safeCompare(cleanCandidate, configuredPassword)
}

export async function hasAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token || !secret()) return false

  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature || !/^\d+$/.test(issuedAt)) return false

  const expected = sign(issuedAt)
  if (!safeCompare(signature, expected)) return false

  return Date.now() - Number(issuedAt) < MAX_AGE_SECONDS * 1000
}

export function adminSessionCookie() {
  const issuedAt = String(Date.now())
  return {
    name: COOKIE,
    value: `${issuedAt}.${sign(issuedAt)}`,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    },
  }
}

export function unauthorized() {
  return Response.json({ error: 'Admin authentication required.' }, { status: 401 })
}
