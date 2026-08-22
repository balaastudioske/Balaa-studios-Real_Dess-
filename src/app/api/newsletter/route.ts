import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { hasAdminSession } from '@/lib/admin-auth'

// In-memory fallback if Firestore is not configured in local environment
const localSubscribers = new Map<string, any>()

export async function POST(req: NextRequest) {
  try {
    const { email, source = 'newsletter' } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const record = {
      email: cleanEmail,
      source,
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    try {
      const subscriberDoc = doc(db, 'subscribers', cleanEmail)
      await setDoc(subscriberDoc, {
        email: cleanEmail,
        source,
        status: 'active',
        createdAt: serverTimestamp(),
      }, { merge: true })
    } catch (fsError) {
      console.warn('[Newsletter API] Firestore write fallback to local memory:', fsError)
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
      const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      snapshot.forEach((doc) => {
        subscribers.push({ id: doc.id, ...doc.data() })
      })
    } catch (fsError) {
      console.warn('[Newsletter API] Firestore read fallback to local memory:', fsError)
    }

    // Merge in-memory subscribers if any
    localSubscribers.forEach((val, key) => {
      if (!subscribers.some((s) => s.email === key)) {
        subscribers.push({ id: key, ...val })
      }
    })

    return NextResponse.json({ subscribers }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscribers.' }, { status: 500 })
  }
}