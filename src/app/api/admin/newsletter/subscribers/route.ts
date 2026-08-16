import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/supabase'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const SORT_COLUMNS = ['email', 'name', 'phone', 'country', 'city', 'source', 'created_at'] as const

function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export async function GET(req: Request) {
  const store = await cookies()
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const url = new URL(req.url)
  const search = url.searchParams.get('search') ?? ''
  const rawSort = url.searchParams.get('sort') ?? 'created_at'
  const sort = (SORT_COLUMNS as readonly string[]).includes(rawSort)
    ? rawSort
    : 'created_at'
  const dir = url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
  const format = url.searchParams.get('format') ?? 'json'

  try {
    const db = getDb()
    let q = db
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: dir === 'asc' })
      .limit(2000)
    const { data, error, count } = await q
    if (error) throw error

    let rows = (data ?? []).map((r) => ({
      email: r.email,
      name: r.name ?? '',
      phone: r.phone ?? '',
      country: r.country ?? '',
      city: r.city ?? '',
      source: r.source ?? '',
      createdAt: r.created_at,
    }))

    const needle = search.trim().toLowerCase()
    if (needle) {
      rows = rows.filter(
        (r) =>
          r.email.toLowerCase().includes(needle) ||
          r.name.toLowerCase().includes(needle),
      )
    }

    if (format === 'csv') {
      const header = ['Email', 'Name', 'Phone', 'Country', 'City', 'Source', 'Subscribed at']
      const lines = [header.join(',')]
      for (const r of rows) {
        lines.push(
          [r.email, r.name, r.phone, r.country, r.city, r.source, r.createdAt]
            .map(csvCell)
            .join(','),
        )
      }
      return new NextResponse('\uFEFF' + lines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="newsletter-subscribers.csv"',
        },
      })
    }

    return NextResponse.json({ subscribers: rows, total: count ?? rows.length })
  } catch (err) {
    console.error('admin subscribers error', err)
    return NextResponse.json(
      { error: 'Could not load subscribers.' },
      { status: 500 },
    )
  }
}