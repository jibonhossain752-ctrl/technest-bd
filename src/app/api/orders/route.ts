import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: {
    contact?: { name?: string; phone?: string; email?: string }
    items?: { name?: string; qty?: number; price?: number }[]
    subscribed?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const contact = {
    name: String(body.contact?.name ?? '').trim(),
    phone: String(body.contact?.phone ?? '').trim(),
    email: String(body.contact?.email ?? '').trim() || undefined,
  }
  const items = Array.isArray(body.items) ? body.items : []
  const subscribed = Boolean(body.subscribed)

  if (!contact.name || !contact.phone || items.length === 0) {
    return NextResponse.json(
      { error: 'Contact details and at least one item are required.' },
      { status: 400 },
    )
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.qty ?? 0),
    0,
  )
  const order = {
    id: `TN-${Date.now()}`,
    contact,
    items: items.map((i) => ({
      name: String(i.name ?? ''),
      qty: Number(i.qty ?? 0),
      price: Number(i.price ?? 0),
    })),
    total,
    subscribed,
    placed_at: new Date().toISOString(),
    status: 'pending',
  }

  try {
    const db = getDb()
    const { error: orderError } = await db.from('orders').insert(order)
    if (orderError) throw orderError

    const subContact = contact.email ?? contact.phone
    if (subContact) {
      const { error: subError } = await db.from('subscriptions').insert({
        contact: subContact,
        subscribed,
      })
      if (subError) throw subError
    }

    return NextResponse.json({
      order: {
        id: order.id,
        contact,
        items: order.items,
        total,
        subscribed,
        placedAt: order.placed_at,
        status: order.status,
      },
    })
  } catch (err) {
    console.error('place order error', err)
    return NextResponse.json(
      { error: 'Order could not be placed. Please try again.' },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? ''
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  try {
    const db = getDb()
    const { data, error } = await db
      .from('orders')
      .select('*')
      .order('placed_at', { ascending: false })
    if (error) throw error

    const orders = (data ?? [])
      .filter(
        (o) =>
          typeof o.contact === 'object' &&
          o.contact !== null &&
          String(o.contact.email ?? '').toLowerCase() === email,
      )
      .map((o) => ({
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
    console.error('get orders error', err)
    return NextResponse.json({ orders: [] })
  }
}
