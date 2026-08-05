import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const subject = String(body?.subject ?? '').trim()
  const message = String(body?.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Name, email and message are required.' },
      { status: 400 },
    )
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Please provide a valid email address.' },
      { status: 400 },
    )
  }

  try {
    const db = getDb()
    const { error } = await db.from('contact_messages').insert({
      name,
      email,
      subject,
      message,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('contact message error', err)
    return NextResponse.json(
      { error: 'Your message could not be sent. Please try again.' },
      { status: 500 },
    )
  }
}
