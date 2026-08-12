import { NextResponse } from 'next/server'
import { aggregateMissing } from '@/lib/analytics-aggregate'
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
    // Time-budgeted: only missing dates are recomputed, and the loop stops
    // well inside the function timeout. `remaining` tells the client whether
    // to call again (AnalyticsBackfill loops until the backfill is done).
    const { results, remaining } = await aggregateMissing(days, 50_000)
    return NextResponse.json({ ok: true, results, remaining })
  } catch (err) {
    console.error('admin aggregate error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}