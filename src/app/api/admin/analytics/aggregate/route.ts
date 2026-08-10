import { NextResponse } from 'next/server'
import { aggregateRange } from '@/lib/analytics-aggregate'
import { isAdmin } from '@/lib/analytics-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const url = new URL(req.url)
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') ?? 30) || 30))
  try {
    // Idempotent: each date is deleted + recomputed, and the summary report
    // is stored inside aggregateDay.
    const results = await aggregateRange(days)
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('admin aggregate error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
