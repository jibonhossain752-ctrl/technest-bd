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
      .from('users')
      .select('id, name, email, phone, subscribed, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const users = (data ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      subscribed: u.subscribed,
      createdAt: u.created_at,
    }))
    return NextResponse.json({ users })
  } catch (err) {
    console.error('admin users error', err)
    return NextResponse.json(
      { error: 'Could not load users.' },
      { status: 500 },
    )
  }
}
