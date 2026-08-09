import { NextResponse } from 'next/server'
import {
  aggregateRange,
  buildDailyReportPayload,
  storeDailyReport,
} from '@/lib/analytics-aggregate'
import { sendDailyReportEmail } from '@/lib/analytics-email'

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

  const forceTest =
    new URL(req.url).searchParams.get('testEmail') === '1'

  try {
    const results = await aggregateRange(3)
    const withEvents = results.filter((r) => r.events > 0)
    const latest = withEvents.length > 0
      ? withEvents[withEvents.length - 1]
      : results[results.length - 1]
    let email = null
    if (latest && latest.events > 0) {
      await storeDailyReport(latest.date)
      const payload = await buildDailyReportPayload(latest.date)
      email = await sendDailyReportEmail(payload, { forceTest })
    }
    return NextResponse.json({ ok: true, results, email })
  } catch (err) {
    // Tables may not exist yet (schema not applied) — log and stay green so
    // the cron doesn't page anyone while the site is mid-migration.
    console.error('cron aggregate error (schema applied?)', err)
    return NextResponse.json({ ok: false, reason: 'aggregation failed' }, { status: 500 })
  }
}
