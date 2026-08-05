import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/supabase'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function GET() {
  const store = await cookies()
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const db = getDb()
    const { data, error } = await db
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    const messages = (data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      createdAt: m.created_at,
    }))
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('admin messages error', err)
    return NextResponse.json(
      { error: 'Could not load messages.' },
      { status: 500 },
    )
  }
}
