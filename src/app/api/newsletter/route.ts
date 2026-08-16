import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SOURCES = ['section', 'widget', 'quick', 'popup', 'account', 'checkout']

export async function POST(req: Request) {
  let body: { email?: string; source?: string; name?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  const rawSource = String(body?.source ?? '').trim().toLowerCase()
  const source = SOURCES.includes(rawSource) ? rawSource : 'section'
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
  }

  const ipCountry = req.headers.get('x-vercel-ip-country') ?? ''
  const ipCity = req.headers.get('x-vercel-ip-city') ?? ''
  const country = /^[A-Z]{2}$/.test(ipCountry) ? ipCountry : ''
  const city = ipCity ? String(ipCity).slice(0, 100) : ''

  try {
    const db = getDb()
    const { error } = await db
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          source,
          name: String(body?.name ?? '').trim().slice(0, 120),
          phone: String(body?.phone ?? '').trim().slice(0, 40),
          country,
          city,
        },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('newsletter signup error', err)
    return NextResponse.json(
      { error: 'Could not save subscription.' },
      { status: 500 },
    )
  }
}