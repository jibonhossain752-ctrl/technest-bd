import { NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics-server'

export const runtime = 'nodejs'
export const maxDuration = 30

interface TrackBody {
  event?: string
  page?: string
  session_id?: string
  source?: string
  device?: string
  os?: string
  browser?: string
  url?: string
  ref_host?: string
  utm?: { source?: string; medium?: string; campaign?: string }
  meta?: Record<string, unknown>
}

export async function POST(req: Request) {
  let body: TrackBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  const sessionId = String(body.session_id ?? '').slice(0, 100)
  const event = String(body.event ?? 'unknown').slice(0, 60)
  if (!sessionId || !event) {
    return NextResponse.json({ ok: false, error: 'Missing session or event.' }, { status: 400 })
  }

  // Vercel-provided request geolocation headers (absent locally -> 'unknown')
  const ipCountry = req.headers.get('x-vercel-ip-country') ?? ''
  const ipCity = req.headers.get('x-vercel-ip-city') ?? ''
  const country = /^[A-Z]{2}$/.test(ipCountry) ? ipCountry : 'unknown'
  const city = ipCity ? String(ipCity).slice(0, 100) : 'unknown'

  const meta = body.meta && typeof body.meta === 'object' ? body.meta : {}
  const { _dedupKey: _stripDedup, ...metaClean } = meta
  const metaSafe =
    JSON.stringify(metaClean).length > 2000 ? { _truncated: true, key: String(_stripDedup ?? '') } : metaClean

  try {
    await recordEvent({
      event,
      page: String(body.page ?? '').slice(0, 200),
      sessionId,
      source: String(body.source ?? 'direct').slice(0, 40),
      device: String(body.device ?? 'unknown').slice(0, 20),
      os: body.os ? String(body.os).slice(0, 40) : undefined,
      browser: body.browser ? String(body.browser).slice(0, 40) : undefined,
      country,
      city,
      url: String(body.url ?? '').slice(0, 500),
      refHost: body.ref_host ? String(body.ref_host).slice(0, 200) : undefined,
      utm: body.utm,
      meta: metaSafe,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('analytics track error', err)
    return NextResponse.json({ ok: false, error: 'Storage error.' }, { status: 500 })
  }
}
