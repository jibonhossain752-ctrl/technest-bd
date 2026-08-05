import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/supabase'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const store = await cookies()
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const status = body.status ?? ''
  if (!STATUSES.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid order status.' },
      { status: 400 },
    )
  }

  const { id } = await ctx.params
  try {
    const db = getDb()
    const { data, error } = await db
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, order: data })
  } catch (err) {
    console.error('admin order update error', err)
    return NextResponse.json(
      { error: 'Could not update the order.' },
      { status: 500 },
    )
  }
}
