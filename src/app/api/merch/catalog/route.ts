import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export async function GET() {
  const filePath = path.join(process.cwd(), 'public/library/merch/catalog.json')
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[merch/catalog] failed to read catalog.json:', err)
    return NextResponse.json({ error: 'Catalog not available' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-static'
export const revalidate = 3600
