import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getDb } from '@/lib/supabase'
import {
  getTopProducts,
  getTopCategories,
  getTopBlogPosts,
  getSourceRankings,
} from '@/lib/analytics-queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  return [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')),
  ].join('\n')
}

export async function GET(request: Request) {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const range = Math.min(90, Math.max(1, Number(searchParams.get('range') ?? 30)))
  const format = searchParams.get('format') === 'json' ? 'json' : 'csv'
  const daysAgo = new Date(Date.now() - range * 86400000).toISOString()

  try {
    const db = getDb()
    const { data: daily, error } = await db
      .from('analytics_daily')
      .select('*')
      .gte('date', daysAgo.slice(0, 10))
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)

    const [products, categories, blogPosts, sources] = await Promise.all([
      getTopProducts(range),
      getTopCategories(range),
      getTopBlogPosts(range),
      getSourceRankings(range),
    ])

    const summary = {
      range,
      daily: (daily ?? []).map((d) => ({
        date: String(d.date).slice(0, 10),
        source: d.source,
        device: d.device,
        country: d.country,
        visitors: d.visitors,
        unique_visitors: d.unique_visitors,
        sessions: d.sessions,
        page_views: d.page_views,
        bounces: d.bounces,
        session_seconds: d.session_seconds,
        affiliate_clicks: d.affiliate_clicks,
        add_to_cart: d.add_to_cart,
        checkouts: d.checkouts,
        newsletter_subscribes: d.newsletter_subscribes,
      })),
      top_products: products,
      top_categories: categories,
      top_blog_posts: blogPosts,
      source_rankings: sources,
      generated_at: new Date().toISOString(),
    }

    if (format === 'json') {
      return NextResponse.json(summary)
    }

    const cols = [
      'date',
      'source',
      'device',
      'country',
      'visitors',
      'unique_visitors',
      'sessions',
      'page_views',
      'bounces',
      'session_seconds',
      'affiliate_clicks',
      'add_to_cart',
      'checkouts',
      'newsletter_subscribes',
    ]
    const csv = toCsv(summary.daily as Record<string, unknown>[], cols)
    const productCsv = toCsv(
      products.map((p) => ({ ...p, name: p.name })),
      ['slug', 'name', 'views', 'addToCart', 'clicks', 'conversions'],
    )
    const combined =
      'TECHNEST ANALYTICS EXPORT - last ' + range + ' days\n\nDAILY\n' + csv +
      '\n\nTOP PRODUCTS\n' + productCsv +
      '\n\nTOP BLOG POSTS\n' +
      toCsv(
        blogPosts.map((b) => ({ ...b })),
        ['slug', 'title', 'views', 'cardClicks', 'deepReads', 'avgSeconds', 'engagement'],
      )

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="technest-analytics-${range}d.csv"`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Export failed.', detail: String(err) },
      { status: 500 },
    )
  }
}
