import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getDb } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  try {
    const db = getDb()
    const { data, error } = await db
      .from('analytics_reports')
      .select('date, created_at, payload')
      .order('date', { ascending: false })
      .limit(30)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const reports = (data ?? []).map((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>
      return {
        date: String(r.date).slice(0, 10),
        createdAt: r.created_at,
        visitors: p.visitors ?? 0,
        pageViews: p.page_views ?? 0,
        sessions: p.sessions ?? 0,
        affiliateClicks: p.affiliate_clicks ?? 0,
        addToCart: p.add_to_cart ?? 0,
        newsletterSubscribes: p.newsletter_subscribes ?? 0,
      }
    })
    return NextResponse.json({ reports })
  } catch (err) {
    return NextResponse.json(
      { error: 'Reports query failed.', detail: String(err) },
      { status: 500 },
    )
  }
}
