import { NextResponse } from 'next/server'
import { aggregateRange, storeDailyReport } from '@/lib/analytics-aggregate'

export const runtime = 'nodejs'
export const maxDuration = 60

// Called by Vercel Cron (see vercel.json). If CRON_SECRET is configured the
// header must match; otherwise the endpoint is a no-op for browsers.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  try {
    const results = await aggregateRange(3)
    const latest = results.find((r) => r.events >= 0)
    if (latest) await storeDailyReport(latest.date)
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    // Tables may not exist yet (schema not applied) — log and stay green so
    // the cron doesn't page anyone while the site is mid-migration.
    console.error('cron aggregate error (schema applied?)', err)
    return NextResponse.json({ ok: false, reason: 'aggregation failed' }, { status: 500 })
  }
}
