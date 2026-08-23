import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
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
    const nowIso = new Date().toISOString()

    const supabase = getSupabaseServerClient()
    const { error: dbError } = await supabase.from('orders').update({
      status,
      confirmed_at: status === 'confirmed' ? nowIso : null,
      updated_at: nowIso,
    }).eq('id', id)

    if (dbError) {
      console.warn('[Confirm Order API] Supabase update warning:', dbError.message)
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
