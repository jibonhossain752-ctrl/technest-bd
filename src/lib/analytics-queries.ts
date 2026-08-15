/**
 * Analytics ranking/query helpers (server-side only).
 *
 * All dashboard display data is read from aggregated tables ONLY:
 *   - analytics_reports (per-day summary payload with every breakdown)
 *   - analytics_daily (trend chart)
 * The raw `analytics_events` table is never queried for dashboard display.
 * The single intentional exception is getRealtimeSnapshot() (live monitor):
 * it is bounded (24h window, LIMIT 60) and by definition cannot be served
 * from pre-aggregated data.
 *
 * Missing/stale aggregate dates are regenerated on demand via
 * aggregateDay() (idempotent delete+recompute), single-flight + 60s TTL.
 */

import { AsyncLocalStorage } from 'async_hooks'
import { getDb } from '@/lib/supabase'
import { REPORT_VERSION, lastNDates } from '@/lib/analytics-aggregate'
import { PRODUCTS } from '@/data/products'
import { POSTS } from '@/data/posts'
import { CATEGORIES } from '@/data/categories'

export const CLICK_EVENTS = [
  'affiliate_click',
  'buy_now',
  'deal_price_click',
] as const

function daysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/* ----------------------------------------------------------------------
   Per-request dedup cache.
   A single dashboard page render calls many ranking functions (e.g. the
   overview page calls 9, the search page calls 5), and each independently
   queried analytics_reports/analytics_daily for the SAME range — meaning the
   same Supabase round-trip happened up to 9x per page load. AsyncLocalStorage
   scopes an in-flight Promise cache to the current HTTP request, so the first
   caller issues the fetch and every concurrent caller within the same render
   await the same Promise. No cross-request leakage; freed when the request
   ends.
---------------------------------------------------------------------- */
interface RequestCache {
  reports: Map<number, Promise<Payload[]>>
  daily: Map<number, Promise<TrendPoint[]>>
}
const requestCache = new AsyncLocalStorage<Map<string, RequestCache>>()

function getScopedCache(): RequestCache {
  let store = requestCache.getStore()
  if (!store) {
    store = new Map<string, RequestCache>()
    requestCache.enterWith(store)
  }
  const key = `q:${daysAgo(0)}`
  let c = store.get(key)
  if (!c) {
    c = { reports: new Map(), daily: new Map() }
    store.set(key, c)
  }
  return c
}

/** Wrap a thunk in a per-request AsyncLocalStorage context (for tests/probes). */
export function withRequestCache<T>(thunk: () => Promise<T>): Promise<T> {
  const store = new Map<string, RequestCache>()
  return requestCache.run(store, thunk)
}

/* --------------------- aggregate freshness (cheap, non-blocking) --------------------- */

let missingCache: { at: number; days: number; missing: string[] } = {
  at: 0,
  days: 0,
  missing: [],
}

/**
 * Dates in the range that lack a version-current report. NEVER aggregates
 * inline: page loads render from whatever reports exist and a client
 * component (AnalyticsBackfill) runs the aggregate route in the background,
 * so a cold/missing backfill cannot block the dashboard for 10+ seconds.
 */
export async function getMissingAnalyticsDays(days: number): Promise<string[]> {
  const now = Date.now()
  if (missingCache.days === days && now - missingCache.at < 60_000) {
    return missingCache.missing
  }
  const dates = lastNDates(days)
  const db = getDb()
  const { data } = await db
    .from('analytics_reports')
    .select('date, payload')
    .gte('date', dates[0])
  const missing = new Set(dates)
  for (const r of data ?? []) {
    const p = (r as { payload: Record<string, unknown> | null }).payload
    if (p && p.version === REPORT_VERSION) {
      missing.delete(String((r as { date: string }).date).slice(0, 10))
    }
  }
  missingCache = { at: now, days, missing: [...missing].sort() }
  return missingCache.missing
}

type Payload = Record<string, unknown>

async function loadReports(days: number): Promise<Payload[]> {
  await getMissingAnalyticsDays(days)
  const cache = getScopedCache()
  const existing = cache.reports.get(days)
  if (existing) return existing
  const p = (async () => {
    const db = getDb()
    const { data, error } = await db
      .from('analytics_reports')
      .select('date, payload')
      .gte('date', daysAgo(days))
      .order('date', { ascending: true })
    if (error) throw new Error('report query failed: ' + error.message)
    const out: Payload[] = []
    for (const r of data ?? []) {
      const pl = (r as { payload: Payload | null }).payload
      if (pl && pl.version === REPORT_VERSION) out.push(pl)
    }
    return out
  })()
  cache.reports.set(days, p)
  // On failure evict so a later retry can re-issue; success stays cached for
  // the remainder of the request.
  p.catch(() => cache.reports.delete(days))
  return p
}

const arr = <T>(p: Payload, key: string): T[] => (p[key] as T[]) ?? []
const num = (v: unknown): number => Number(v ?? 0)

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
  const reports = await loadReports(days)
  const counts = new Map<string, { views: number; add: number; clicks: number }>()
  for (const p of reports) {
    for (const c of arr<{ slug: string; views: number; add: number; clicks: number }>(p, 'products')) {
      const agg = counts.get(c.slug) ?? { views: 0, add: 0, clicks: 0 }
      agg.views += num(c.views)
      agg.add += num(c.add)
      agg.clicks += num(c.clicks)
      counts.set(c.slug, agg)
    }
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
  const reports = await loadReports(days)
  const counts = new Map<string, { views: number; clicks: number }>()
  for (const p of reports) {
    for (const c of arr<{ slug: string; views: number; clicks: number }>(p, 'categories')) {
      const agg = counts.get(c.slug) ?? { views: 0, clicks: 0 }
      agg.views += num(c.views)
      agg.clicks += num(c.clicks)
      counts.set(c.slug, agg)
    }
  }
  const rows: TopCategoryRow[] = []
  for (const [slug, c] of counts) {
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
  const reports = await loadReports(days)
  const aggMap = new Map<
    string,
    { views: number; cardClicks: number; deepReads: number; timeSeconds: number; timeCount: number }
  >()
  for (const p of reports) {
    for (const b of arr<{
      slug: string
      views: number
      cardClicks: number
      deepReads: number
      timeSeconds: number
      timeCount: number
    }>(p, 'blogPosts')) {
      const agg = aggMap.get(b.slug) ?? { views: 0, cardClicks: 0, deepReads: 0, timeSeconds: 0, timeCount: 0 }
      agg.views += num(b.views)
      agg.cardClicks += num(b.cardClicks)
      agg.deepReads += num(b.deepReads)
      agg.timeSeconds += num(b.timeSeconds)
      agg.timeCount += num(b.timeCount)
      aggMap.set(b.slug, agg)
    }
  }
  const rows: TopBlogRow[] = []
  for (const [slug, b] of aggMap) {
    const post = POSTS.find((p) => p.slug === slug)
    if (!post) continue
    const avgSeconds = b.timeCount ? Math.round(b.timeSeconds / b.timeCount) : 0
    const engagement = Math.round(
      ((b.deepReads / b.views) * 100 + Math.min(avgSeconds / 120, 1) * 100) / 2,
    )
    rows.push({
      slug,
      title: post.title,
      views: b.views,
      cardClicks: b.cardClicks,
      deepReads: b.deepReads,
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
  const reports = await loadReports(days)
  const aggMap = new Map<
    string,
    { sessions: number; pageViews: number; bounces: number; timeSeconds: number; adds: number; clicks: number; subs: number }
  >()
  for (const p of reports) {
    for (const s of arr<{
      source: string
      sessions: number
      pageViews: number
      bounces: number
      timeSeconds: number
      adds: number
      clicks: number
      subs: number
    }>(p, 'sources')) {
      const agg = aggMap.get(s.source) ?? { sessions: 0, pageViews: 0, bounces: 0, timeSeconds: 0, adds: 0, clicks: 0, subs: 0 }
      agg.sessions += num(s.sessions)
      agg.pageViews += num(s.pageViews)
      agg.bounces += num(s.bounces)
      agg.timeSeconds += num(s.timeSeconds)
      agg.adds += num(s.adds)
      agg.clicks += num(s.clicks)
      agg.subs += num(s.subs)
      aggMap.set(s.source, agg)
    }
  }

  const rows: SourceRankRow[] = []
  for (const source of KNOWN_SOURCES) {
    const s = aggMap.get(source)
    if (!s || s.sessions === 0) continue
    const viewsPerSession = Math.round((s.pageViews / s.sessions) * 100) / 100
    const avgSeconds = s.sessions ? Math.round(s.timeSeconds / s.sessions) : 0
    const bounceRate = s.sessions ? Math.round((s.bounces / s.sessions) * 100) : 0
    const convRate = s.pageViews ? ((s.adds + s.clicks) / s.pageViews) * 100 : 0
    const engagement =
      viewsPerSession >= 2 && avgSeconds >= 60 && bounceRate <= 50 ? 1 : 0
    const performance = Math.round(
      Math.min(100, engagement * 60 + Math.min(convRate * 2, 40)),
    )
    rows.push({
      source,
      sessions: s.sessions,
      pageViews: s.pageViews,
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
  const reports = await loadReports(days)
  const totals = { sessions: 0, views: 0, adds: 0, clicks: 0, subs: 0 }
  for (const p of reports) {
    totals.sessions += num(p.sessions)
    totals.views += num(p.page_views)
    totals.adds += num(p.add_to_cart)
    totals.clicks += num(p.affiliate_clicks)
    totals.subs += num(p.newsletter_subscribes)
  }
  return [
    { label: 'Sessions', count: totals.sessions },
    { label: 'Page Views', count: totals.views },
    { label: 'Add to Cart', count: totals.adds },
    { label: 'Buy / Affiliate', count: totals.clicks },
    { label: 'Newsletter Signups', count: totals.subs },
  ]
}

export interface TrendPoint {
  date: string
  visitors: number
  pageViews: number
  sessions: number
  affiliateClicks: number
  bounces: number
}

export async function getDailyTrend(days: number): Promise<TrendPoint[]> {
  await getMissingAnalyticsDays(days)
  const cache = getScopedCache()
  let fetcher = cache.daily.get(days)
  if (!fetcher) {
    fetcher = (async () => {
      const db = getDb()
      const { data, error } = await db
        .from('analytics_daily')
        .select('date, visitors, page_views, sessions, affiliate_clicks, bounces')
        .gte('date', daysAgo(days))
        .order('date', { ascending: true })
      if (error) throw new Error('trend query failed: ' + error.message)
      const byDate = new Map<
        string,
        { visitors: number; pageViews: number; sessions: number; affiliateClicks: number; bounces: number }
      >()
      for (const r of data ?? []) {
        const date = String(r.date).slice(0, 10)
        const agg =
          byDate.get(date) ?? { visitors: 0, pageViews: 0, sessions: 0, affiliateClicks: 0, bounces: 0 }
        agg.visitors += num(r.visitors)
        agg.pageViews += num(r.page_views)
        agg.sessions += num(r.sessions)
        agg.affiliateClicks += num(r.affiliate_clicks)
        agg.bounces += num(r.bounces)
        byDate.set(date, agg)
      }
      return [...byDate.entries()].map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date))
    })()
    cache.daily.set(days, fetcher)
    fetcher.catch(() => cache.daily.delete(days))
  }
  return fetcher
}

/* ------------------------------- B7 realtime ------------------------------ */

export interface RealtimeSnapshot {
  onlineNow: number
  recent: RawEvent[]
  last24hClicks: number
  last24hViews: number
  affiliateFeed: AffiliateFeedItem[]
}

export interface AffiliateFeedItem {
  id: number
  event: string
  page: string | null
  source: string | null
  productSlug: string | null
  postSlug: string | null
  created_at: string
}

/**
 * Live monitor — intentionally reads recent raw events (bounded: 24h window,
 * LIMIT 60, ordered by created_at). Cannot be pre-aggregated; this is the
 * single documented exception to the aggregates-only dashboard rule.
 */
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
    .select('id, event, page, source, session_id, meta, created_at')
    .gte('created_at', dayAgo)
    .order('created_at', { ascending: false })
    .limit(60)
  const events = (recent ?? []) as (RawEvent & { id?: number })[]
  const clickEvents = events.filter((r) =>
    CLICK_EVENTS.includes(r.event as (typeof CLICK_EVENTS)[number]),
  )
  const affiliateFeed: AffiliateFeedItem[] = clickEvents
    .slice(0, 10)
    .map((r) => {
      const m = (r.meta ?? {}) as Record<string, unknown>
      return {
        id: Number(r.id ?? 0),
        event: r.event,
        page: r.page ?? null,
        source: r.source ?? null,
        productSlug:
          typeof m.product_slug === 'string' ? m.product_slug : null,
        postSlug: typeof m.post_slug === 'string' ? m.post_slug : null,
        created_at: r.created_at,
      }
    })
  return {
    onlineNow,
    recent: events,
    last24hClicks: clickEvents.length,
    last24hViews: events.filter((r) => r.event === 'page_view').length,
    affiliateFeed,
  }
}

interface RawEvent {
  event: string
  page: string | null
  source: string | null
  session_id: string | null
  meta: Record<string, unknown> | null
  ref_host?: string | null
  created_at: string
}

export async function getTopPages(days: number): Promise<{ page: string; count: number }[]> {
  const reports = await loadReports(days)
  const counts = new Map<string, number>()
  for (const p of reports) {
    for (const t of arr<{ page: string; views: number }>(p, 'top_pages')) {
      counts.set(t.page, (counts.get(t.page) ?? 0) + num(t.views))
    }
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

export async function getSearchRankings(
  days: number,
): Promise<{ product: SearchTermRow[]; blog: SearchTermRow[] }> {
  const reports = await loadReports(days)
  const productTerms: { term: string; searches: number; noResults: number; clickThroughs: number }[] = []
  const blogTerms: { term: string; searches: number; noResults: number; clickThroughs: number }[] = []
  for (const p of reports) {
    const s = (p.search ?? {}) as {
      product?: { term: string; searches: number; noResults: number; clickThroughs: number }[]
      blog?: { term: string; searches: number; noResults: number; clickThroughs: number }[]
    }
    productTerms.push(...(s.product ?? []))
    blogTerms.push(...(s.blog ?? []))
  }
  const rank = (
    list: { term: string; searches: number; noResults: number; clickThroughs: number }[],
  ): SearchTermRow[] => {
    const merged = new Map<string, { searches: number; noResults: number; clickThroughs: number }>()
    for (const t of list) {
      const agg = merged.get(t.term) ?? { searches: 0, noResults: 0, clickThroughs: 0 }
      agg.searches += num(t.searches)
      agg.noResults += num(t.noResults)
      agg.clickThroughs += num(t.clickThroughs)
      merged.set(t.term, agg)
    }
    return [...merged.entries()]
      .map(([term, a]) => ({
        term,
        searches: a.searches,
        noResults: a.noResults,
        clickThrough: a.clickThroughs,
        clickRate: a.searches ? Math.round((a.clickThroughs / a.searches) * 100) : 0,
      }))
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 20)
  }
  return { product: rank(productTerms), blog: rank(blogTerms) }
}

export async function getSearchClickRank(
  days: number,
): Promise<{ product: SearchResultRow[]; blog: SearchResultRow[] }> {
  const reports = await loadReports(days)
  const rank = (
    list: { slug: string; clicks: number }[],
    nameOf: (slug: string) => string,
  ): SearchResultRow[] => {
    const merged = new Map<string, number>()
    for (const c of list) merged.set(c.slug, (merged.get(c.slug) ?? 0) + num(c.clicks))
    return [...merged.entries()]
      .map(([slug, clicks]) => ({ slug, name: nameOf(slug), clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20)
  }
  const productList: { slug: string; clicks: number }[] = []
  const blogList: { slug: string; clicks: number }[] = []
  for (const p of reports) {
    const s = (p.search ?? {}) as {
      productClicks?: { slug: string; clicks: number }[]
      blogClicks?: { slug: string; clicks: number }[]
    }
    productList.push(...(s.productClicks ?? []))
    blogList.push(...(s.blogClicks ?? []))
  }
  return {
    product: rank(productList, (slug) => PRODUCTS.find((p) => p.slug === slug)?.name ?? slug),
    blog: rank(blogList, (slug) => POSTS.find((p) => p.slug === slug)?.title ?? slug),
  }
}

/* ---------------------------- C3: FAQ rankings ---------------------------- */

export interface FaqExpandRow {
  question: string
  count: number
  location: string
}

export async function getFaqExpandRanking(days: number): Promise<FaqExpandRow[]> {
  const reports = await loadReports(days)
  const merged = new Map<string, { count: number; location: string }>()
  for (const p of reports) {
    for (const f of arr<{ question: string; count: number; location: string }>(p, 'faq')) {
      const agg = merged.get(f.question) ?? { count: 0, location: f.location }
      agg.count += num(f.count)
      merged.set(f.question, agg)
    }
  }
  return [...merged.entries()]
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
  const reports = await loadReports(days)
  const merged = new Map<string, { views: number; sessions: number }>()
  for (const p of reports) {
    for (const s of arr<{ page: string; googleViews: number; googleSessions: number }>(p, 'sePages')) {
      if (!s.page.startsWith('/faq')) continue
      const agg = merged.get(s.page) ?? { views: 0, sessions: 0 }
      agg.views += num(s.googleViews)
      agg.sessions += num(s.googleSessions)
      merged.set(s.page, agg)
    }
  }
  return [...merged.entries()]
    .map(([page, a]) => ({ page, views: a.views, sessions: a.sessions }))
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
  const reports = await loadReports(days)
  const merged: Record<string, Map<string, { sessions: number; pageViews: number; conversions: number }>> = {
    devices: new Map(),
    os: new Map(),
    browsers: new Map(),
  }
  for (const p of reports) {
    const d = (p.devices ?? {}) as Record<string, unknown>
    for (const kind of ['devices', 'os', 'browsers'] as const) {
      for (const row of (d[kind] as { key: string; sessions: number; pageViews: number; conversions: number }[]) ?? []) {
        const agg = merged[kind].get(row.key) ?? { sessions: 0, pageViews: 0, conversions: 0 }
        agg.sessions += num(row.sessions)
        agg.pageViews += num(row.pageViews)
        agg.conversions += num(row.conversions)
        merged[kind].set(row.key, agg)
      }
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
      .slice(0, 20)
  return {
    devices: map(merged.devices),
    os: map(merged.os),
    browsers: map(merged.browsers),
  }
}

/* ---------------------------- E: location analytics ---------------------------- */

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
  BD: 'Bangladesh',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IN: 'India',
  PK: 'Pakistan',
  AE: 'United Arab Emirates',
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
  const reports = await loadReports(days)
  const merged = new Map<
    string,
    { sessions: number; pageViews: number; conversions: number; cities: Map<string, { sessions: number; pageViews: number; conversions: number }> }
  >()
  for (const p of reports) {
    for (const loc of arr<{
      country: string
      sessions: number
      pageViews: number
      conversions: number
      cities: { city: string; sessions: number; pageViews: number; conversions: number }[]
    }>(p, 'locations')) {
      const row =
        merged.get(loc.country) ??
        { sessions: 0, pageViews: 0, conversions: 0, cities: new Map<string, { sessions: number; pageViews: number; conversions: number }>() }
      row.sessions += num(loc.sessions)
      row.pageViews += num(loc.pageViews)
      row.conversions += num(loc.conversions)
      for (const c of loc.cities ?? []) {
        const city = row.cities.get(c.city) ?? { sessions: 0, pageViews: 0, conversions: 0 }
        city.sessions += num(c.sessions)
        city.pageViews += num(c.pageViews)
        city.conversions += num(c.conversions)
        row.cities.set(c.city, city)
      }
      merged.set(loc.country, row)
    }
  }
  const rows: LocationRow[] = []
  for (const [country, r] of merged) {
    const cities = [...r.cities.entries()]
      .map(([city, c]) => ({ city, ...c }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)
    rows.push({
      country,
      countryName: COUNTRY_NAMES[country] ?? country,
      sessions: r.sessions,
      pageViews: r.pageViews,
      conversions: r.conversions,
      conversionRate: r.sessions ? Math.round((r.conversions / r.sessions) * 1000) / 10 : 0,
      cities,
    })
  }
  rows.sort((a, b) => b.sessions - a.sessions)
  return rows.slice(0, 20)
}

/* --------------------- B7: search engine traffic per page --------------------- */

export interface SearchEngineTrafficRow {
  page: string
  googleViews: number
  googleSessions: number
}

/**
 * Organic search traffic per page from referral headers (any search engine:
 * google/bing/duckduckgo summed — Search Console is not connected).
 */
export async function getSearchEngineTraffic(
  days: number,
): Promise<SearchEngineTrafficRow[]> {
  const reports = await loadReports(days)
  const merged = new Map<string, { views: number; sessions: number }>()
  for (const p of reports) {
    for (const s of arr<{
      page: string
      googleViews: number
      bingViews: number
      ddgViews: number
      googleSessions: number
      bingSessions: number
      ddgSessions: number
    }>(p, 'sePages')) {
      const agg = merged.get(s.page) ?? { views: 0, sessions: 0 }
      agg.views += num(s.googleViews) + num(s.bingViews) + num(s.ddgViews)
      agg.sessions += num(s.googleSessions) + num(s.bingSessions) + num(s.ddgSessions)
      merged.set(s.page, agg)
    }
  }
  return [...merged.entries()]
    .map(([page, r]) => ({ page, googleViews: r.views, googleSessions: r.sessions }))
    .sort((a, b) => b.googleViews - a.googleViews)
    .slice(0, 20)
}

/* ------------------------- D: newsletter subscribe rate ------------------------ */

export interface NewsletterStats {
  subscribes: number
  impressions: number
  subscribeRate: number
  byLocation: { location: string; countryName: string; subscribes: number; impressions: number }[]
}

/**
 * Rate = subscribes / impressions (popup + hamburger quick-subscribe box).
 */
export async function getNewsletterStats(days: number): Promise<NewsletterStats> {
  const reports = await loadReports(days)
  const merged = new Map<string, { shown: number; subscribes: number }>()
  let subscribes = 0
  let impressions = 0
  for (const p of reports) {
    for (const n of arr<{ location: string; shown: number; subscribes: number }>(p, 'newsletter')) {
      const agg = merged.get(n.location) ?? { shown: 0, subscribes: 0 }
      agg.shown += num(n.shown)
      agg.subscribes += num(n.subscribes)
      merged.set(n.location, agg)
      impressions += num(n.shown)
      subscribes += num(n.subscribes)
    }
  }
  return {
    subscribes,
    impressions,
    subscribeRate: impressions
      ? Math.round((subscribes / impressions) * 10000) / 100
      : 0,
    byLocation: [...merged.entries()]
      .map(([location, a]) => ({
        location,
        countryName: COUNTRY_NAMES[location] ?? location,
        subscribes: a.subscribes,
        impressions: a.shown,
      }))
      .sort((a, b) => b.impressions - a.impressions),
  }
}
