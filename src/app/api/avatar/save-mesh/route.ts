import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { hasAdminSession, unauthorized } from '@/lib/admin-auth'

const MAX_MESH_BYTES = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession())) return unauthorized()
    const { searchParams } = new URL(request.url)
    const filepath = searchParams.get('filepath')

    if (!filepath) {
      return NextResponse.json(
        { success: false, error: 'filepath parameter is required' },
        { status: 400 }
      )
    }

    // Sanitize and ensure path is within public/library/
    const cleanPath = filepath.replace(/\\/g, '/')
    if (!cleanPath.startsWith('public/library/')) {
      return NextResponse.json(
        { success: false, error: 'Path must be inside public/library/' },
        { status: 403 }
      )
    }

    const libraryRoot = path.resolve(process.cwd(), 'public', 'library')
    const dest = path.resolve(process.cwd(), cleanPath)
    if (!dest.startsWith(`${libraryRoot}${path.sep}`)) {
      return NextResponse.json({ success: false, error: 'Invalid destination path' }, { status: 403 })
    }
    await fs.mkdir(path.dirname(dest), { recursive: true })

    // Read the binary body buffer
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_MESH_BYTES) {
      return NextResponse.json({ success: false, error: 'Mesh payload must be between 1 byte and 25 MB' }, { status: 413 })
    }

    await fs.writeFile(dest, buffer)
    console.info(`[API] Saved mesh (${buffer.length} bytes)`)

    return NextResponse.json({ success: true, size: buffer.length })
  } catch (error: any) {
    console.error('[API] Failed to save mesh:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save mesh file' },
      { status: 500 }
    )
  }
}
