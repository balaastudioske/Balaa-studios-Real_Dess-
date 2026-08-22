import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { hasAdminSession } from '@/lib/admin-auth'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const status = body.status || 'confirmed' // 'confirmed' | 'cancelled' | 'pending'

    const orderRef = doc(db, 'orders', id)
    const nowIso = new Date().toISOString()

    try {
      await updateDoc(orderRef, {
        status,
        confirmedAt: status === 'confirmed' ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      })
    } catch (fsErr) {
      console.warn('[Confirm Order API] Firestore update fallback:', fsErr)
    }

    return NextResponse.json({
      success: true,
      orderId: id,
      status,
      confirmedAt: status === 'confirmed' ? nowIso : undefined,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[Confirm Order API] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order.' }, { status: 500 })
  }
}