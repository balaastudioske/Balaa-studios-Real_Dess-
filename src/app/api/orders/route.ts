import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, getDocs, getDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore'
import { hasAdminSession } from '@/lib/admin-auth'
import { generateOrderReference } from '@/lib/mpesa-till'
import { BalaaOrder } from '@/types/orders'

// In-memory fallback store for development resilience
const localOrders = new Map<string, BalaaOrder>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, userEmail, userName = '', type, itemId, itemTitle, amount, currency = 'KSH', metadata = {} } = body

    if (!userEmail || !type || !itemId || !itemTitle || amount === undefined) {
      return NextResponse.json({ error: 'Missing required order fields (userEmail, type, itemId, itemTitle, amount).' }, { status: 400 })
    }

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    const reference = generateOrderReference()
    const nowIso = new Date().toISOString()

    const order: BalaaOrder = {
      id: orderId,
      reference,
      userId: userId || 'guest_' + Math.random().toString(36).substring(2, 8),
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName.trim(),
      type,
      itemId,
      itemTitle,
      amount: Number(amount),
      currency,
      status: 'pending',
      metadata,
      createdAt: nowIso,
    }

    try {
      const orderRef = doc(db, 'orders', orderId)
      await setDoc(orderRef, {
        ...order,
        createdAt: serverTimestamp(),
      })

      // Also record email to subscribers collection
      const subRef = doc(db, 'subscribers', order.userEmail)
      await setDoc(subRef, {
        email: order.userEmail,
        source: `${type}_order`,
        status: 'active',
        createdAt: serverTimestamp(),
      }, { merge: true })
    } catch (fsError) {
      console.warn('[Orders API] Firestore fallback to memory:', fsError)
      localOrders.set(orderId, order)
    }

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error: any) {
    console.error('[Orders API] Create error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create order.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const userEmail = searchParams.get('userEmail')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')
    const isAdmin = await hasAdminSession()

    // 1. Single order query
    if (orderId) {
      try {
        const docSnap = await getDoc(doc(db, 'orders', orderId))
        if (docSnap.exists()) {
          const data = docSnap.data() as BalaaOrder
          return NextResponse.json({ order: { ...data, id: docSnap.id } })
        }
      } catch {}
      if (localOrders.has(orderId)) {
        return NextResponse.json({ order: localOrders.get(orderId) })
      }
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // 2. User specific query
    if (userId || userEmail) {
      const results: BalaaOrder[] = []
      try {
        const q = userEmail
          ? query(collection(db, 'orders'), where('userEmail', '==', userEmail.trim().toLowerCase()), orderBy('createdAt', 'desc'))
          : query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        snapshot.forEach((d) => {
          results.push({ id: d.id, ...d.data() } as BalaaOrder)
        })
      } catch (fsErr) {
        console.warn('[Orders API] Firestore query error; falling back to local memory:', fsErr)
      }

      // Merge local in-memory
      localOrders.forEach((o) => {
        if ((userId && o.userId === userId) || (userEmail && o.userEmail === userEmail.trim().toLowerCase())) {
          if (!results.some((r) => r.id === o.id)) {
            results.push(o)
          }
        }
      })

      return NextResponse.json({ orders: results }, { status: 200 })
    }

    // 3. Admin all orders query
    if (!isAdmin) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const allOrders: BalaaOrder[] = []
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      snapshot.forEach((d) => {
        allOrders.push({ id: d.id, ...d.data() } as BalaaOrder)
      })
    } catch (fsErr) {
      console.warn('[Orders API] Firestore list error, falling back:', fsErr)
    }

    localOrders.forEach((o) => {
      if (!allOrders.some((r) => r.id === o.id)) {
        allOrders.push(o)
      }
    })

    const filtered = status ? allOrders.filter((o) => o.status === status) : allOrders
    return NextResponse.json({ orders: filtered }, { status: 200 })
  } catch (error: any) {
    console.error('[Orders API] List error:', error)
    return NextResponse.json({ error: error.message || 'Failed to list orders.' }, { status: 500 })
  }
}