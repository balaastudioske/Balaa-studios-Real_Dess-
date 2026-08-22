import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession, unauthorized } from '@/lib/admin-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasAdminSession())) return unauthorized()
  const { id } = await params
  return NextResponse.json({ success: true, id })
}
