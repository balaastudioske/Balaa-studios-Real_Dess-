import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { hasAdminSession } from '@/lib/admin-auth'

// In-memory fallback if needed
const localSubscribers = new Map<string, any>()

export async function POST(req: NextRequest) {
  try {
    const { email, source = 'newsletter' } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const nowIso = new Date().toISOString()
    const record = {
      id: cleanEmail,
      email: cleanEmail,
      source,
      status: 'active',
      created_at: nowIso,
    }

    try {
      const supabase = getSupabaseServerClient()
      const { error: dbError } = await supabase.from('newsletter_subscribers').upsert(record, {
        onConflict: 'email',
      })
      if (dbError) {
        console.warn('[Newsletter API] Supabase write fallback:', dbError.message)
        localSubscribers.set(cleanEmail, record)
      }
    } catch (dbErr) {
      console.warn('[Newsletter API] Supabase write error:', dbErr)
      localSubscribers.set(cleanEmail, record)
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully.' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Subscription failed.' }, { status: 500 })
  }
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const subscribers: any[] = []
    try {
      const supabase = getSupabaseServerClient()
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false })

      if (data && !error) {
        data.forEach((doc) => {
          subscribers.push({
            id: doc.id || doc.email,
            email: doc.email,
            source: doc.source,
            status: doc.status,
            createdAt: doc.created_at,
          })
        })
      }
    } catch (dbErr) {
      console.warn('[Newsletter API] Supabase read fallback:', dbErr)
    }

    // Merge in-memory subscribers if any
    localSubscribers.forEach((val, key) => {
      if (!subscribers.some((s) => s.email === key)) {
        subscribers.push({
          id: key,
          email: val.email,
          source: val.source,
          status: val.status,
          createdAt: val.created_at,
        })
      }
    })

    return NextResponse.json({ subscribers }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscribers.' }, { status: 500 })
  }
}
