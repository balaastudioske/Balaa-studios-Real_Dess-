import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { hasAdminSession } from '@/lib/admin-auth'
import { generateOrderReference } from '@/lib/mpesa-till'
import { BalaaOrder } from '@/types/orders'

// In-memory fallback store for resilience
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
      const supabase = getSupabaseServerClient()
      const { error: dbError } = await supabase.from('orders').insert({
        id: order.id,
        reference: order.reference,
        user_id: order.userId,
        user_email: order.userEmail,
        user_name: order.userName,
        type: order.type,
        item_id: order.itemId,
        item_title: order.itemTitle,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        metadata: order.metadata,
        created_at: order.createdAt,
      })

      if (dbError) {
        console.warn('[Orders API] Supabase insert warning; fallback to memory:', dbError.message)
        localOrders.set(orderId, order)
      }

      // Auto-record subscriber
      try {
        await supabase.from('newsletter_subscribers').upsert({
          id: order.userEmail,
          email: order.userEmail,
          source: `${type}_order`,
          status: 'active',
          created_at: nowIso,
        }, { onConflict: 'email' })
      } catch {}
    } catch (dbErr) {
      console.warn('[Orders API] Database error fallback:', dbErr)
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
    const supabase = getSupabaseServerClient()

    // 1. Single order query
    if (orderId) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
        if (data && !error) {
          const mapped: BalaaOrder = {
            id: data.id,
            reference: data.reference,
            userId: data.user_id,
            userEmail: data.user_email,
            userName: data.user_name,
            type: data.type,
            itemId: data.item_id,
            itemTitle: data.item_title,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            metadata: data.metadata || {},
            createdAt: data.created_at,
            confirmedAt: data.confirmed_at,
          }
          return NextResponse.json({ order: mapped })
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
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (userEmail) {
          query = query.eq('user_email', userEmail.trim().toLowerCase())
        } else if (userId) {
          query = query.eq('user_id', userId)
        }
        const { data, error } = await query
        if (data && !error) {
          data.forEach((d) => {
            results.push({
              id: d.id,
              reference: d.reference,
              userId: d.user_id,
              userEmail: d.user_email,
              userName: d.user_name,
              type: d.type,
              itemId: d.item_id,
              itemTitle: d.item_title,
              amount: Number(d.amount),
              currency: d.currency,
              status: d.status,
              metadata: d.metadata || {},
              createdAt: d.created_at,
              confirmedAt: d.confirmed_at,
            })
          })
        }
      } catch (dbErr) {
        console.warn('[Orders API] Database query error:', dbErr)
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
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (status) {
        query = query.eq('status', status)
      }
      const { data, error } = await query
      if (data && !error) {
        data.forEach((d) => {
          allOrders.push({
            id: d.id,
            reference: d.reference,
            userId: d.user_id,
            userEmail: d.user_email,
            userName: d.user_name,
            type: d.type,
            itemId: d.item_id,
            itemTitle: d.item_title,
            amount: Number(d.amount),
            currency: d.currency,
            status: d.status,
            metadata: d.metadata || {},
            createdAt: d.created_at,
            confirmedAt: d.confirmed_at,
          })
        })
      }
    } catch (dbErr) {
      console.warn('[Orders API] Supabase list error, falling back:', dbErr)
    }

    localOrders.forEach((o) => {
      if (!allOrders.some((r) => r.id === o.id)) {
        if (!status || o.status === status) {
          allOrders.push(o)
        }
      }
    })

    return NextResponse.json({ orders: allOrders }, { status: 200 })
  } catch (error: any) {
    console.error('[Orders API] List error:', error)
    return NextResponse.json({ error: error.message || 'Failed to list orders.' }, { status: 500 })
  }
}
