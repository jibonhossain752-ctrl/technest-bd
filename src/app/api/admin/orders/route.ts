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
      .from('orders')
      .select('*')
      .order('placed_at', { ascending: false })
    if (error) throw error

    const orders = (data ?? []).map((o) => ({
      id: o.id,
      contact: o.contact,
      items: o.items,
      total: Number(o.total),
      subscribed: o.subscribed,
      placedAt: o.placed_at,
      status: o.status,
    }))
    return NextResponse.json({ orders })
  } catch (err) {
    console.error('admin orders error', err)
    return NextResponse.json(
      { error: 'Could not load orders.' },
      { status: 500 },
    )
  }
}
