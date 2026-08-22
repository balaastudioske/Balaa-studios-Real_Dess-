import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { hasAdminSession, unauthorized } from '@/lib/admin-auth'

export interface SaveDesignRequest {
  id: string
  name: string
  meshes: Record<string, boolean>
  colors: Record<string, string>
  meshOverrides?: Record<string, { visible?: boolean; color?: string }>
}

const DESIGNS_FILE = path.join(process.cwd(), 'public', 'library', 'wardrobe', 'saved-designs.json')

export async function GET() {
  try {
    try {
      const data = await fs.readFile(DESIGNS_FILE, 'utf-8')
      const designs: SaveDesignRequest[] = JSON.parse(data)
      return NextResponse.json({ success: true, designs: Array.isArray(designs) ? designs : [] })
    } catch {
      return NextResponse.json({ success: true, designs: [] })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve saved designs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession())) return unauthorized()
    const savedDesign: SaveDesignRequest = await request.json()

    if (!savedDesign || typeof savedDesign !== 'object' || !savedDesign.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data. ID is required.' },
        { status: 400 }
      )
    }

    const dir = path.dirname(DESIGNS_FILE)
    await fs.mkdir(dir, { recursive: true })

    let designs: SaveDesignRequest[] = []
    try {
      const data = await fs.readFile(DESIGNS_FILE, 'utf-8')
      designs = JSON.parse(data)
      if (!Array.isArray(designs)) {
        designs = []
      }
    } catch {
      designs = []
    }

    const existingIndex = designs.findIndex((d) => d.id === savedDesign.id)
    if (existingIndex >= 0) {
      designs[existingIndex] = savedDesign
    } else {
      designs.push(savedDesign)
    }

    await fs.writeFile(DESIGNS_FILE, JSON.stringify(designs, null, 2), 'utf-8')

    return NextResponse.json({ success: true, design: savedDesign })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save design' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await hasAdminSession())) return unauthorized()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data. ID is required.' },
        { status: 400 }
      )
    }

    let designs: SaveDesignRequest[] = []
    try {
      const data = await fs.readFile(DESIGNS_FILE, 'utf-8')
      designs = JSON.parse(data)
      if (!Array.isArray(designs)) {
        designs = []
      }
    } catch {
      return NextResponse.json({ success: true })
    }

    const filtered = designs.filter((d) => d.id !== id)
    await fs.writeFile(DESIGNS_FILE, JSON.stringify(filtered, null, 2), 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}
