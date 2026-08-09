import { NextResponse } from 'next/server'
import { aggregateRange, storeDailyReport } from '@/lib/analytics-aggregate'
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
    const results = await aggregateRange(days)
    const withEvents = results.filter((r) => r.events > 0)
    const latest = withEvents.length > 0
      ? withEvents[withEvents.length - 1]
      : results[results.length - 1]
    let report = false
    if (latest) report = await storeDailyReport(latest.date)
    return NextResponse.json({ ok: true, results, report })
  } catch (err) {
    console.error('admin aggregate error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
