/**
 * Analytics ranking/query helpers (server-side only).
 * Computes C1–C4 rankings, B6 funnel/performance estimates and B7 realtime
 * snapshots from the raw `analytics_events` table (plus `analytics_daily`
 * for trend charts when aggregates exist).
 */

import { getDb } from '@/lib/supabase'
import { PRODUCTS } from '@/data/products'
import { POSTS } from '@/data/posts'
import { CATEGORIES } from '@/data/categories'

export const CLICK_EVENTS = [
  'affiliate_click',
  'buy_now',
  'deal_price_click',
] as const

const VIEW_EVENTS = ['product_view', 'add_to_cart', 'buy_now', 'affiliate_click']

interface RawEvent {
  event: string
  page: string | null
  source: string | null
  session_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

async function fetchEvents(
  days: number,
  events: string[],
): Promise<RawEvent[]> {
  const db = getDb()
  const out: RawEvent[] = []
  let from = 0
  const pageSize = 1000
  for (;;) {
    const { data, error } = await db
      .from('analytics_events')
      .select('event, page, source, session_id, meta, created_at')
      .in('event', events)
      .gte('created_at', daysAgo(days))
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) throw new Error('analytics query failed: ' + error.message)
    if (!data || data.length === 0) break
    out.push(...(data as RawEvent[]))
    from += pageSize
    if (data.length < pageSize) break
  }
  return out
}

function metaSlug(meta: Record<string, unknown> | null): string | null {
  const s = meta?.product_slug ?? meta?.slug ?? meta?.post_slug
  return typeof s === 'string' && s ? s : null
}

/* ---------------------------------- C1 ---------------------------------- */

export interface TopProductRow {
  slug: string
  name: string
  image: string
  price: number | null
  views: number
  addToCart: number
  clicks: number
  conversions: number
}

export async function getTopProducts(days: number): Promise<TopProductRow[]> {
  const events = await fetchEvents(days, VIEW_EVENTS)
  const counts = new Map<string, { views: number; add: number; clicks: number }>()
  for (const e of events) {
    const slug = metaSlug(e.meta)
    if (!slug) continue
    const c = counts.get(slug) ?? { views: 0, add: 0, clicks: 0 }
    if (e.event === 'product_view') c.views++
    else if (e.event === 'add_to_cart') c.add++
    else c.clicks++
    counts.set(slug, c)
  }
  const rows: TopProductRow[] = []
  for (const [slug, c] of counts) {
    const product = PRODUCTS.find((p) => p.slug === slug)
    if (!product) continue
    rows.push({
      slug,
      name: product.name,
      image: product.image,
      price: product.price,
      views: c.views,
      addToCart: c.add,
      clicks: c.clicks,
      conversions: c.add + c.clicks,
    })
  }
  rows.sort((a, b) => b.views - a.views)
  return rows.slice(0, 20)
}

/* ---------------------------------- C2 ---------------------------------- */

export interface TopCategoryRow {
  slug: string
  name: string
  icon: string
  views: number
  clicks: number
}

export async function getTopCategories(days: number): Promise<TopCategoryRow[]> {
  const events = await fetchEvents(days, VIEW_EVENTS)
  const bySlug = new Map<string, { views: number; clicks: number }>()
  const bump = (slug: string | null, kind: 'views' | 'clicks') => {
    if (!slug) return
    const c = bySlug.get(slug) ?? { views: 0, clicks: 0 }
    c[kind]++
    bySlug.set(slug, c)
  }
  for (const e of events) {
    const slug = metaSlug(e.meta)
    if (!slug) continue
    const product = PRODUCTS.find((p) => p.slug === slug)
    const cat = product?.categorySlug ?? null
    if (e.event === 'product_view') bump(cat, 'views')
    else if (e.event === 'add_to_cart') bump(cat, 'views')
    else bump(cat, 'clicks')
  }
  const catEvents = await fetchEvents(days, ['category_select', 'page_view'])
  for (const e of catEvents) {
    if (e.event === 'category_select') {
      const slug = metaSlug(e.meta)
      bump(slug, 'views')
      continue
    }
    const page = e.page ?? ''
    const m = page.match(/^\/shop\/([^/]+)/)
    if (m) bump(m[1], 'views')
  }
  const rows: TopCategoryRow[] = []
  for (const [slug, c] of bySlug) {
    const cat = CATEGORIES.find((x) => x.slug === slug)
    if (!cat) continue
    rows.push({ slug, name: cat.name, icon: cat.icon, views: c.views, clicks: c.clicks })
  }
  rows.sort((a, b) => b.views - a.views)
  return rows
}

/* ---------------------------------- C3 ---------------------------------- */

export interface TopBlogRow {
  slug: string
  title: string
  views: number
  cardClicks: number
  deepReads: number
  avgSeconds: number
  engagement: number
}

export async function getTopBlogPosts(days: number): Promise<TopBlogRow[]> {
  const events = await fetchEvents(days, [
    'page_view',
    'blog_card_click',
    'scroll_depth',
    'time_on_page',
  ])
  const views = new Map<string, number>()
  const cardClicks = new Map<string, number>()
  const deepReads = new Map<string, number>()
  const timeSums = new Map<string, { total: number; count: number }>()

  const postSlug = (e: RawEvent): string | null => {
    const page = e.page ?? ''
    const m = page.match(/^\/blog\/([^/]+)/)
    return m ? m[1] : null
  }

  for (const e of events) {
    if (e.event === 'page_view') {
      const s = postSlug(e)
      if (s) views.set(s, (views.get(s) ?? 0) + 1)
    } else if (e.event === 'blog_card_click') {
      const s = metaSlug(e.meta)
      if (s) cardClicks.set(s, (cardClicks.get(s) ?? 0) + 1)
    } else if (e.event === 'scroll_depth' && e.meta?.percent === 100) {
      const s = postSlug(e)
      if (s) deepReads.set(s, (deepReads.get(s) ?? 0) + 1)
    } else if (e.event === 'time_on_page') {
      const s = postSlug(e)
      if (!s) continue
      const secs = Number(e.meta?.seconds ?? 0)
      if (secs > 0) {
        const t = timeSums.get(s) ?? { total: 0, count: 0 }
        t.total += secs
        t.count++
        timeSums.set(s, t)
      }
    }
  }

  const rows: TopBlogRow[] = []
  for (const [slug, count] of views) {
    const post = POSTS.find((p) => p.slug === slug)
    if (!post) continue
    const reads = deepReads.get(slug) ?? 0
    const clicks = cardClicks.get(slug) ?? 0
    const t = timeSums.get(slug)
    const avgSeconds = t && t.count ? Math.round(t.total / t.count) : 0
    const engagement = Math.round(
      ((reads / count) * 100 + Math.min(avgSeconds / 120, 1) * 100) / 2,
    )
    rows.push({
      slug,
      title: post.title,
      views: count,
      cardClicks: clicks,
      deepReads: reads,
      avgSeconds,
      engagement,
    })
  }
  rows.sort((a, b) => b.views - a.views)
  return rows.slice(0, 20)
}

/* ---------------------------------- C4 ---------------------------------- */

export interface SourceRankRow {
  source: string
  sessions: number
  pageViews: number
  viewsPerSession: number
  avgSeconds: number
  bounceRate: number
  addToCarts: number
  affiliateClicks: number
  newsletterSubscribes: number
  performance: number
  estimatedClicks: number
}

const KNOWN_SOURCES = [
  'direct',
  'facebook',
  'instagram',
  'youtube',
  'tiktok',
  'pinterest',
  'whatsapp',
  'google',
  'referral',
]

export async function getSourceRankings(days: number): Promise<SourceRankRow[]> {
  const events = await fetchEvents(days, [
    'page_view',
    'time_on_page',
    'add_to_cart',
    'affiliate_click',
    'buy_now',
    'newsletter_subscribe',
  ])
  const bySource = new Map<
    string,
    {
      sessions: Set<string>
      views: number
      timeSum: number
      timeCount: number
      pageSet: Map<string, Set<string>>
      adds: number
      clicks: number
      subs: number
    }
  >()
  const ensure = (source: string) => {
    let s = bySource.get(source)
    if (!s) {
      s = {
        sessions: new Set(),
        views: 0,
        timeSum: 0,
        timeCount: 0,
        pageSet: new Map(),
        adds: 0,
        clicks: 0,
        subs: 0,
      }
      bySource.set(source, s)
    }
    return s
  }
  for (const e of events) {
    const source = e.source ?? 'direct'
    const s = ensure(source)
    const sid = e.session_id ?? ''
    if (e.event === 'page_view') {
      s.views++
      s.sessions.add(sid)
      const pageSet = s.pageSet.get(sid) ?? new Set<string>()
      pageSet.add(e.page ?? '')
      s.pageSet.set(sid, pageSet)
    } else if (e.event === 'time_on_page') {
      const secs = Number(e.meta?.seconds ?? 0)
      if (secs > 0) {
        s.timeSum += secs
        s.timeCount++
      }
    } else if (e.event === 'add_to_cart') s.adds++
    else if (CLICK_EVENTS.includes(e.event as (typeof CLICK_EVENTS)[number])) s.clicks++
    else if (e.event === 'newsletter_subscribe') s.subs++
  }

  const rows: SourceRankRow[] = []
  for (const source of KNOWN_SOURCES) {
    const s = bySource.get(source)
    if (!s) continue
    const sessions = s.sessions.size
    let bounces = 0
    for (const pages of s.pageSet.values()) {
      if (pages.size <= 1) bounces++
    }
    const bounceRate = sessions ? Math.round((bounces / sessions) * 100) : 0
    const avgSeconds = s.timeCount ? Math.round(s.timeSum / s.timeCount) : 0
    const viewsPerSession = sessions ? Math.round((s.views / sessions) * 100) / 100 : 0
    const convRate = s.views ? ((s.adds + s.clicks) / s.views) * 100 : 0
    const engagement =
      viewsPerSession >= 2 && avgSeconds >= 60 && bounceRate <= 50 ? 1 : 0
    const performance = Math.round(
      Math.min(100, engagement * 60 + Math.min(convRate * 2, 40)),
    )
    rows.push({
      source,
      sessions,
      pageViews: s.views,
      viewsPerSession,
      avgSeconds,
      bounceRate,
      addToCarts: s.adds,
      affiliateClicks: s.clicks,
      newsletterSubscribes: s.subs,
      performance,
      estimatedClicks: s.clicks,
    })
  }
  rows.sort((a, b) => b.performance - a.performance)
  return rows
}

/* --------------------------- B6 funnel / trend --------------------------- */

export interface FunnelRow {
  label: string
  count: number
}

export async function getFunnel(days: number): Promise<FunnelRow[]> {
  const events = await fetchEvents(days, [
    'session_start',
    'page_view',
    'add_to_cart',
    'buy_now',
    'affiliate_click',
    'newsletter_subscribe',
  ])
  const count = (eventsToCount: string[]) => {
    const set = new Set<string>()
    for (const e of events) {
      if (!eventsToCount.includes(e.event)) continue
      if (e.session_id) set.add(e.session_id)
    }
    return set.size
  }
  return [
    { label: 'Sessions', count: count(['session_start']) },
    { label: 'Page Views', count: count(['page_view']) },
    { label: 'Add to Cart', count: count(['add_to_cart']) },
    { label: 'Buy / Affiliate', count: count(['buy_now', 'affiliate_click']) },
    { label: 'Newsletter Signups', count: count(['newsletter_subscribe']) },
  ]
}

export interface TrendPoint {
  date: string
  visitors: number
  pageViews: number
  sessions: number
  affiliateClicks: number
}

export async function getDailyTrend(days: number): Promise<TrendPoint[]> {
  const db = getDb()
  const { data, error } = await db
    .from('analytics_daily')
    .select('date, visitors, page_views, sessions, affiliate_clicks')
    .gte('date', daysAgo(days).slice(0, 10))
    .order('date', { ascending: true })
  if (!error && data && data.length > 0) {
    return (data as unknown as Array<{
      date: string
      visitors: number
      page_views: number
      sessions: number
      affiliate_clicks: number
    }>).map((r) => ({
      date: String(r.date).slice(0, 10),
      visitors: r.visitors,
      pageViews: r.page_views,
      sessions: r.sessions,
      affiliateClicks: r.affiliate_clicks,
    }))
  }
  // Fallback: raw events when aggregation hasn't run yet.
  const events = await fetchEvents(days, ['page_view', 'affiliate_click', 'buy_now'])
  const map = new Map<string, TrendPoint>()
  for (const e of events) {
    const date = e.created_at.slice(0, 10)
    const p = map.get(date) ?? {
      date,
      visitors: 0,
      pageViews: 0,
      sessions: 0,
      affiliateClicks: 0,
    }
    if (e.event === 'page_view') {
      p.pageViews++
      p.visitors++
      p.sessions++
    } else {
      p.affiliateClicks++
    }
    map.set(date, p)
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/* ------------------------------- B7 realtime ------------------------------ */

export interface RealtimeSnapshot {
  onlineNow: number
  recent: RawEvent[]
  last24hClicks: number
  last24hViews: number
}

export async function getRealtimeSnapshot(): Promise<RealtimeSnapshot> {
  const db = getDb()
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count } = await db
    .from('analytics_sessions')
    .select('id', { count: 'exact', head: true })
    .gte('last_activity', fiveMinAgo)
  const onlineNow = count ?? 0

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await db
    .from('analytics_events')
    .select('event, page, source, session_id, meta, created_at')
    .gte('created_at', dayAgo)
    .order('created_at', { ascending: false })
    .limit(60)
  const clickEvents = (recent ?? []).filter((r) =>
    CLICK_EVENTS.includes(r.event as (typeof CLICK_EVENTS)[number]),
  )
  return {
    onlineNow,
    recent: (recent ?? []) as RawEvent[],
    last24hClicks: clickEvents.length,
    last24hViews: (recent ?? []).filter((r) => r.event === 'page_view').length,
  }
}

export async function getTopPages(days: number): Promise<{ page: string; count: number }[]> {
  const events = await fetchEvents(days, ['page_view'])
  const counts = new Map<string, number>()
  for (const e of events) {
    const page = e.page ?? '/'
    counts.set(page, (counts.get(page) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

/* --------------------------- C3: search rankings --------------------------- */

export interface SearchTermRow {
  term: string
  searches: number
  noResults: number
  clickThrough: number
  clickRate: number
}

export interface SearchResultRow {
  slug: string
  name: string
  clicks: number
}

const SEARCH_LOOKAHEAD_MS = 60 * 1000

interface SessionEvent {
  t: number
  e: string
  meta: Record<string, unknown>
  page: string
}

async function fetchSearchEvents(days: number): Promise<Map<string, SessionEvent[]>> {
  const events = await fetchEvents(days, [
    'shop_search',
    'blog_search',
    'product_view',
    'blog_card_click',
    'blog_popular_post_click',
    'page_view',
  ])
  const bySession = new Map<string, SessionEvent[]>()
  for (const e of events) {
    const sid = e.session_id ?? ''
    if (!sid) continue
    const arr = bySession.get(sid) ?? []
    arr.push({
      t: new Date(e.created_at).getTime(),
      e: e.event,
      meta: e.meta ?? {},
      page: e.page ?? '',
    })
    bySession.set(sid, arr)
  }
  for (const arr of bySession.values()) arr.sort((a, b) => a.t - b.t)
  return bySession
}

function searchTerm(e: SessionEvent): string {
  return typeof e.meta.query === 'string' ? e.meta.query.trim().slice(0, 100) : ''
}

export async function getSearchRankings(
  days: number,
): Promise<{ product: SearchTermRow[]; blog: SearchTermRow[] }> {
  const bySession = await fetchSearchEvents(days)
  const buckets = {
    product: new Map<string, { searches: number; noResults: number; clickThrough: number }>(),
    blog: new Map<string, { searches: number; noResults: number; clickThrough: number }>(),
  }
  for (const arr of bySession.values()) {
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i]
      if (s.e !== 'shop_search' && s.e !== 'blog_search') continue
      const term = searchTerm(s)
      if (!term) continue
      const bucket = buckets[s.e === 'shop_search' ? 'product' : 'blog']
      const agg = bucket.get(term) ?? { searches: 0, noResults: 0, clickThrough: 0 }
      agg.searches++
      if (Number(s.meta.results ?? -1) === 0) agg.noResults++
      for (let j = i + 1; j < arr.length; j++) {
        const n = arr[j]
        if (n.t - s.t > SEARCH_LOOKAHEAD_MS) break
        if (n.e === 'shop_search' || n.e === 'blog_search') break
        const clicked =
          s.e === 'shop_search'
            ? n.e === 'product_view'
            : n.e === 'blog_card_click' ||
              n.e === 'blog_popular_post_click' ||
              (n.e === 'page_view' && /^\/blog\//.test(n.page))
        if (clicked) {
          agg.clickThrough++
          break
        }
      }
      bucket.set(term, agg)
    }
  }
  const rank = (
    map: Map<string, { searches: number; noResults: number; clickThrough: number }>,
  ): SearchTermRow[] =>
    [...map.entries()]
      .map(([term, a]) => ({
        term,
        searches: a.searches,
        noResults: a.noResults,
        clickThrough: a.clickThrough,
        clickRate: a.searches ? Math.round((a.clickThrough / a.searches) * 100) : 0,
      }))
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 20)
  return { product: rank(buckets.product), blog: rank(buckets.blog) }
}

export async function getSearchClickRank(
  days: number,
): Promise<{ product: SearchResultRow[]; blog: SearchResultRow[] }> {
  const bySession = await fetchSearchEvents(days)
  const productClicks = new Map<string, number>()
  const blogClicks = new Map<string, number>()
  for (const arr of bySession.values()) {
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i]
      if (s.e !== 'shop_search' && s.e !== 'blog_search') continue
      for (let j = i + 1; j < arr.length; j++) {
        const n = arr[j]
        if (n.t - s.t > SEARCH_LOOKAHEAD_MS) break
        if (n.e === 'shop_search' || n.e === 'blog_search') break
        if (s.e === 'shop_search' && n.e === 'product_view') {
          const slug =
            typeof n.meta.product_slug === 'string'
              ? n.meta.product_slug
              : typeof n.meta.slug === 'string'
                ? n.meta.slug
                : ''
          if (slug) productClicks.set(slug, (productClicks.get(slug) ?? 0) + 1)
          break
        }
        if (s.e === 'blog_search') {
          let slug = ''
          if (n.e === 'blog_card_click' || n.e === 'blog_popular_post_click') {
            slug =
              typeof n.meta.post_slug === 'string'
                ? n.meta.post_slug
                : typeof n.meta.slug === 'string'
                  ? n.meta.slug
                  : ''
          } else if (n.e === 'page_view' && /^\/blog\//.test(n.page)) {
            slug = n.page.replace(/^\/blog\//, '').split(/[/?#]/)[0]
          }
          if (slug) blogClicks.set(slug, (blogClicks.get(slug) ?? 0) + 1)
          if (n.e === 'blog_card_click' || n.e === 'blog_popular_post_click') break
        }
      }
    }
  }
  const product: SearchResultRow[] = [...productClicks.entries()]
    .map(([slug, clicks]) => ({
      slug,
      name: PRODUCTS.find((p) => p.slug === slug)?.name ?? slug,
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)
  const blog: SearchResultRow[] = [...blogClicks.entries()]
    .map(([slug, clicks]) => ({
      slug,
      name: POSTS.find((p) => p.slug === slug)?.title ?? slug,
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)
  return { product, blog }
}

/* ---------------------------- C3: FAQ rankings ---------------------------- */

export interface FaqExpandRow {
  question: string
  count: number
  location: string
}

export async function getFaqExpandRanking(days: number): Promise<FaqExpandRow[]> {
  const events = await fetchEvents(days, ['faq_expand'])
  const byQuestion = new Map<string, { count: number; location: string }>()
  for (const e of events) {
    const q = typeof e.meta?.question === 'string' ? e.meta.question.trim() : ''
    if (!q) continue
    const loc = typeof e.meta?.location === 'string' ? e.meta.location : 'unknown'
    const agg = byQuestion.get(q) ?? { count: 0, location: loc }
    agg.count++
    byQuestion.set(q, agg)
  }
  return [...byQuestion.entries()]
    .map(([question, a]) => ({ question, count: a.count, location: a.location }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

export interface FaqGoogleRow {
  page: string
  views: number
  sessions: number
}

export async function getFaqGoogleTraffic(days: number): Promise<FaqGoogleRow[]> {
  const events = await fetchEvents(days, ['page_view'])
  const byPage = new Map<string, { views: number; sessions: Set<string> }>()
  for (const e of events) {
    const page = e.page ?? ''
    if (!page.startsWith('/faq')) continue
    if ((e.source ?? '') !== 'google') continue
    const agg = byPage.get(page) ?? { views: 0, sessions: new Set<string>() }
    agg.views++
    if (e.session_id) agg.sessions.add(e.session_id)
    byPage.set(page, agg)
  }
  return [...byPage.entries()]
    .map(([page, a]) => ({ page, views: a.views, sessions: a.sessions.size }))
    .sort((a, b) => b.views - a.views)
}

/* ---------------------------- E: device analytics ---------------------------- */

export interface DeviceAnalyticsRow {
  key: string
  sessions: number
  pageViews: number
  conversions: number
  conversionRate: number
}

export async function getDeviceAnalytics(days: number): Promise<{
  devices: DeviceAnalyticsRow[]
  os: DeviceAnalyticsRow[]
  browsers: DeviceAnalyticsRow[]
}> {
  const db = getDb()
  const { data: sessions, error } = await db
    .from('analytics_sessions')
    .select('session_id, device, os, browser, page_views')
    .gte('started_at', daysAgo(days))
  if (error) throw new Error('device query failed: ' + error.message)

  const events = await fetchEvents(days, ['add_to_cart', 'buy_now', 'affiliate_click', 'deal_price_click'])
  const convSessions = new Set<string>()
  for (const e of events) if (e.session_id) convSessions.add(e.session_id)

  const by = {
    devices: new Map<string, { sessions: number; pageViews: number; conversions: number }>(),
    os: new Map<string, { sessions: number; pageViews: number; conversions: number }>(),
    browsers: new Map<string, { sessions: number; pageViews: number; conversions: number }>(),
  }
  for (const s of sessions ?? []) {
    const sid = String(s.session_id ?? '')
    const conv = convSessions.has(sid) ? 1 : 0
    for (const [kind, key] of [
      ['devices', String(s.device ?? 'unknown')],
      ['os', String(s.os ?? 'unknown')],
      ['browsers', String(s.browser ?? 'unknown')],
    ] as const) {
      const agg = by[kind].get(key) ?? { sessions: 0, pageViews: 0, conversions: 0 }
      agg.sessions++
      agg.pageViews += Number(s.page_views ?? 1)
      agg.conversions += conv
      by[kind].set(key, agg)
    }
  }
  const map = (m: Map<string, { sessions: number; pageViews: number; conversions: number }>): DeviceAnalyticsRow[] =>
    [...m.entries()]
      .map(([key, a]) => ({
        key,
        sessions: a.sessions,
        pageViews: a.pageViews,
        conversions: a.conversions,
        conversionRate: a.sessions ? Math.round((a.conversions / a.sessions) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
  return { devices: map(by.devices), os: map(by.os), browsers: map(by.browsers) }
}

/* --------------------------- E: location analytics --------------------------- */

export interface LocationRow {
  country: string
  countryName: string
  sessions: number
  pageViews: number
  conversions: number
  conversionRate: number
  cities: { city: string; sessions: number; pageViews: number; conversions: number }[]
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  BD: 'Bangladesh',
  AE: 'UAE',
  AU: 'Australia',
  JP: 'Japan',
  SG: 'Singapore',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  IE: 'Ireland',
  NZ: 'New Zealand',
  PH: 'Philippines',
  PK: 'Pakistan',
  MY: 'Malaysia',
  TH: 'Thailand',
  ID: 'Indonesia',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  EG: 'Egypt',
  TR: 'Turkey',
  ES: 'Spain',
  IT: 'Italy',
  PT: 'Portugal',
  PL: 'Poland',
}

export async function getLocationAnalytics(days: number): Promise<LocationRow[]> {
  const db = getDb()
  const { data: sessions, error } = await db
    .from('analytics_sessions')
    .select('session_id, country, city, page_views')
    .gte('started_at', daysAgo(days))
  if (error) throw new Error('location query failed: ' + error.message)

  const events = await fetchEvents(days, ['add_to_cart', 'buy_now', 'affiliate_click', 'deal_price_click'])
  const convSessions = new Set<string>()
  for (const e of events) if (e.session_id) convSessions.add(e.session_id)

  const byCountry = new Map<string, LocationRow>()
  for (const s of sessions ?? []) {
    const country = String(s.country ?? 'unknown')
    const city = String(s.city ?? 'unknown')
    const row =
      byCountry.get(country) ?? {
        country,
        countryName: COUNTRY_NAMES[country] ?? country,
        sessions: 0,
        pageViews: 0,
        conversions: 0,
        conversionRate: 0,
        cities: [],
      }
    row.sessions++
    row.pageViews += Number(s.page_views ?? 1)
    if (convSessions.has(String(s.session_id ?? ''))) row.conversions++
    let c = row.cities.find((x) => x.city === city)
    if (!c) {
      c = { city, sessions: 0, pageViews: 0, conversions: 0 }
      row.cities.push(c)
    }
    c.sessions++
    c.pageViews += Number(s.page_views ?? 1)
    if (convSessions.has(String(s.session_id ?? ''))) c.conversions++
    byCountry.set(country, row)
  }
  const rows = [...byCountry.values()]
  for (const r of rows) {
    r.conversionRate = r.sessions ? Math.round((r.conversions / r.sessions) * 1000) / 10 : 0
    r.cities.sort((a, b) => b.sessions - a.sessions)
    r.cities = r.cities.slice(0, 5)
  }
  rows.sort((a, b) => b.sessions - a.sessions)
  return rows.slice(0, 20)
}
