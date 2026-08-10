import { getDb } from './supabase'
import { fetchEvents, CLICK_EVENTS } from './analytics-server'
import { PRODUCTS } from '@/data/products'

export const REPORT_VERSION = 2

function dayRange(dateStr: string) {
  const start = new Date(dateStr + 'T00:00:00.000Z')
  const end = new Date(start.getTime() + 86400000)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function lastNDates(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    out.push(dateStr(d))
  }
  return out
}

function metaSlug(meta: Record<string, unknown> | null | undefined): string | null {
  const s = meta?.product_slug ?? meta?.slug ?? meta?.post_slug
  return typeof s === 'string' && s ? s : null
}

function seEngine(r: any): 'google' | 'bing' | 'duckduckgo' | null {
  if (r.source === 'google') return 'google'
  const ref = String(r.ref_host ?? '').toLowerCase()
  if (ref.includes('bing')) return 'bing'
  if (ref.includes('duckduckgo')) return 'duckduckgo'
  return null
}

const SEARCH_LOOKAHEAD_MS = 60 * 1000

/**
 * Pipeline stage per day: raw events + sessions -> analytics_daily /
 * analytics_pages_daily / analytics_reports (summary payload with every
 * breakdown the dashboards need).
 *
 * Idempotent: existing rows for the date are deleted before recompute, so
 * re-running a date never double-counts (cron overlaps date ranges by design).
 */
export async function aggregateDay(
  date: string,
  db = getDb(),
): Promise<{ date: string; events: number; payload: Record<string, unknown> }> {
  const { startIso, endIso } = dayRange(date)

  await db.from('analytics_daily').delete().eq('date', date)
  await db.from('analytics_pages_daily').delete().eq('date', date)
  await db.from('analytics_reports').delete().eq('date', date)

  // ---- events by (source, device, country) ----
  const daily = new Map<string, Record<string, number>>()
  const pages = new Map<string, Record<string, number>>()
  const uniqueBy: Record<string, Set<string>> = {}
  const uniquePages = new Map<string, Set<string>>()
  let eventCount = 0

  const keyOf = (r: any) =>
    [r.source || 'direct', r.device || 'unknown', r.country || 'unknown'].join('|')

  const bump = (map: Map<string, Record<string, number>>, key: string, field: string, by = 1) => {
    const cur = map.get(key) ?? {}
    cur[field] = (cur[field] ?? 0) + by
    map.set(key, cur)
  }

  // ---- breakdowns (from the day's events) ----
  const products = new Map<string, { views: number; add: number; clicks: number }>()
  const categories = new Map<string, { views: number; clicks: number }>()
  const blogPosts = new Map<
    string,
    { views: number; cardClicks: number; deepReads: number; timeSeconds: number; timeCount: number }
  >()
  const sourceEvents = new Map<
    string,
    { adds: number; clicks: number; subs: number }
  >()
  const faq = new Map<string, { question: string; location: string; count: number }>()
  const newsletter = new Map<
    string,
    { shown: number; subscribes: number }
  >()
  const sePages = new Map<
    string,
    { googleViews: number; bingViews: number; ddgViews: number; sessions: Map<string, Set<string>> }
  >()
  const convSessions = new Set<string>()
  const osBySession = new Map<string, { os: string; browser: string }>()
  const sessionsByEvent = new Map<string, { t: number; e: string; meta: Record<string, unknown>; page: string }[]>()

  const blogSlugOf = (page: string | null): string | null => {
    const m = String(page ?? '').match(/^\/blog\/([^/]+)/)
    return m ? m[1] : null
  }
  const catOf = (slug: string | null): string | null =>
    slug ? (PRODUCTS.find((p) => p.slug === slug)?.categorySlug ?? null) : null

  await fetchEvents(startIso, endIso, async (rows) => {
    for (const r of rows) {
      eventCount++
      const k = keyOf(r)
      bump(daily, k, 'page_views', 0) // placeholder to create row
      const metric = metricFor(r.event)
      if (metric) bump(daily, k, metric)

      // per-page
      const page = r.page || 'unknown'
      if (r.event === 'page_view') {
        bump(daily, k, 'page_views', 1)
        bump(pages, page, 'views', 1)
        ;(uniquePages.get(page) ?? uniquePages.set(page, new Set()).get(page)!).add(r.session_id)
        if (r.ref_host) bump(pages, page, 'referral_hits', 1)
      }
      if (r.event === 'time_on_page' || r.event === 'page_exit') {
        bump(pages, page, 'time_on_page_seconds', Math.max(0, Number(r.meta?.seconds ?? 0) || 0))
        bump(pages, page, 'exits', 1)
      }
      const uniqKey = `${k}|${r.session_id}`
      ;(uniqueBy[k] ?? (uniqueBy[k] = new Set())).add(uniqKey)

      // conversion session set (any click/add_to_cart that day)
      if (r.event === 'add_to_cart' || CLICK_EVENTS.has(r.event)) convSessions.add(r.session_id)

      // ---- breakdowns ----
      const slug = metaSlug(r.meta)
      if (r.event === 'product_view') {
        if (slug) {
          const c = products.get(slug) ?? { views: 0, add: 0, clicks: 0 }
          c.views++
          products.set(slug, c)
          const cat = catOf(slug)
          if (cat) {
            const cc = categories.get(cat) ?? { views: 0, clicks: 0 }
            cc.views++
            categories.set(cat, cc)
          }
        }
      } else if (r.event === 'add_to_cart') {
        if (slug) {
          const c = products.get(slug) ?? { views: 0, add: 0, clicks: 0 }
          c.add++
          products.set(slug, c)
          const cat = catOf(slug)
          if (cat) {
            const cc = categories.get(cat) ?? { views: 0, clicks: 0 }
            cc.views++
            categories.set(cat, cc)
          }
        }
      } else if (r.event === 'buy_now' || r.event === 'affiliate_click') {
        if (slug) {
          const c = products.get(slug) ?? { views: 0, add: 0, clicks: 0 }
          c.clicks++
          products.set(slug, c)
          const cat = catOf(slug)
          if (cat) {
            const cc = categories.get(cat) ?? { views: 0, clicks: 0 }
            cc.clicks++
            categories.set(cat, cc)
          }
        }
      } else if (r.event === 'category_select') {
        const cat = slug
        if (cat) {
          const cc = categories.get(cat) ?? { views: 0, clicks: 0 }
          cc.views++
          categories.set(cat, cc)
        }
      } else if (r.event === 'blog_card_click') {
        const s = slug
        if (s) {
          const b = blogPosts.get(s) ?? { views: 0, cardClicks: 0, deepReads: 0, timeSeconds: 0, timeCount: 0 }
          b.cardClicks++
          blogPosts.set(s, b)
        }
      }

      const blogSlug = blogSlugOf(page)
      if (blogSlug) {
        if (r.event === 'page_view') {
          const b = blogPosts.get(blogSlug) ?? { views: 0, cardClicks: 0, deepReads: 0, timeSeconds: 0, timeCount: 0 }
          b.views++
          blogPosts.set(blogSlug, b)
        } else if (r.event === 'scroll_depth' && r.meta?.percent === 100) {
          const b = blogPosts.get(blogSlug) ?? { views: 0, cardClicks: 0, deepReads: 0, timeSeconds: 0, timeCount: 0 }
          b.deepReads++
          blogPosts.set(blogSlug, b)
        } else if (r.event === 'time_on_page') {
          const secs = Number(r.meta?.seconds ?? 0)
          if (secs > 0) {
            const b = blogPosts.get(blogSlug) ?? { views: 0, cardClicks: 0, deepReads: 0, timeSeconds: 0, timeCount: 0 }
            b.timeSeconds += secs
            b.timeCount++
            blogPosts.set(blogSlug, b)
          }
        }
      }

      const src = r.source || 'direct'
      if (r.event === 'add_to_cart') bump(sourceEvents, src, 'adds')
      else if (CLICK_EVENTS.has(r.event)) bump(sourceEvents, src, 'clicks')
      else if (r.event === 'newsletter_subscribe') bump(sourceEvents, src, 'subs')

      if (r.event === 'faq_expand') {
        const q = typeof r.meta?.question === 'string' ? r.meta.question.trim() : ''
        if (q) {
          const loc = typeof r.meta?.location === 'string' ? r.meta.location : 'unknown'
          const f = faq.get(q) ?? { question: q, location: loc, count: 0 }
          f.count++
          faq.set(q, f)
        }
      }

      if (
        r.event === 'newsletter_subscribe' ||
        r.event === 'newsletter_popup_shown' ||
        r.event === 'newsletter_shown'
      ) {
        const loc = String(r.meta?.location ?? 'other') as string
        const bucket = loc === 'popup' ? 'popup' : loc === 'quick' ? 'quick' : 'other'
        const n = newsletter.get(bucket) ?? { shown: 0, subscribes: 0 }
        if (r.event === 'newsletter_subscribe') n.subscribes++
        else n.shown++
        newsletter.set(bucket, n)
      }

      if (r.event === 'page_view' || r.event === 'session_start') {
        const engine = seEngine(r)
        if (engine) {
          const p = page === 'unknown' ? '/' : page
          const row =
            sePages.get(p) ??
            { googleViews: 0, bingViews: 0, ddgViews: 0, sessions: new Map<string, Set<string>>() }
          if (engine === 'google') row.googleViews++
          else if (engine === 'bing') row.bingViews++
          else row.ddgViews++
          ;(row.sessions.get(engine) ?? row.sessions.set(engine, new Set()).get(engine)!).add(r.session_id)
          sePages.set(p, row)
        }
      }

      if (['shop_search', 'blog_search', 'product_view', 'blog_card_click', 'blog_popular_post_click'].includes(r.event)) {
        const sid = r.session_id
        if (sid) {
          const arr = sessionsByEvent.get(sid) ?? []
          arr.push({ t: new Date(r.created_at).getTime(), e: r.event, meta: r.meta ?? {}, page: r.page ?? '' })
          sessionsByEvent.set(sid, arr)
        }
      }

      if (r.event === 'session_start') {
        osBySession.set(r.session_id, { os: r.os || 'unknown', browser: r.browser || 'unknown' })
      }
    }
  })

  // ---- search term rankings (per-session lookahead) ----
  const searchProduct = new Map<string, { searches: number; noResults: number; clickThroughs: number }>()
  const searchBlog = new Map<string, { searches: number; noResults: number; clickThroughs: number }>()
  const searchProductClicks = new Map<string, number>()
  const searchBlogClicks = new Map<string, number>()
  for (const arr of sessionsByEvent.values()) {
    arr.sort((a, b) => a.t - b.t)
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i]
      if (s.e !== 'shop_search' && s.e !== 'blog_search') continue
      const term = typeof s.meta.query === 'string' ? s.meta.query.trim().slice(0, 100) : ''
      if (!term) continue
      const bucket = s.e === 'shop_search' ? searchProduct : searchBlog
      const agg = bucket.get(term) ?? { searches: 0, noResults: 0, clickThroughs: 0 }
      agg.searches++
      if (Number(s.meta.results ?? -1) === 0) agg.noResults++
      for (let j = i + 1; j < arr.length; j++) {
        const n = arr[j]
        if (n.t - s.t > SEARCH_LOOKAHEAD_MS) break
        if (n.e === 'shop_search' || n.e === 'blog_search') break
        if (s.e === 'shop_search' && n.e === 'product_view') {
          const rslug = metaSlug(n.meta)
          if (rslug) searchProductClicks.set(rslug, (searchProductClicks.get(rslug) ?? 0) + 1)
          agg.clickThroughs++
          break
        }
        if (s.e === 'blog_search') {
          const clicked =
            n.e === 'blog_card_click' ||
            n.e === 'blog_popular_post_click' ||
            (n.e === 'page_view' && /^\/blog\//.test(n.page))
          if (!clicked) continue
          let rslug = metaSlug(n.meta)
          if (!rslug && n.e === 'page_view') rslug = n.page.replace(/^\/blog\//, '').split(/[/?#]/)[0]
          if (rslug) searchBlogClicks.set(rslug, (searchBlogClicks.get(rslug) ?? 0) + 1)
          agg.clickThroughs++
          if (n.e !== 'page_view') break
        }
      }
      bucket.set(term, agg)
    }
  }

  // ---- sessions ----
  const { data: sessions } = await db
    .from('analytics_sessions')
    .select('*')
    .gte('started_at', startIso)
    .lt('started_at', endIso)
  const sessionsFor = (s: any) => {
    const k = [s.source || 'direct', s.device || 'unknown', s.country || 'unknown'].join('|')
    const rec = daily.get(k) ?? {}
    rec.sessions = (rec.sessions ?? 0) + 1
    rec.session_seconds = (rec.session_seconds ?? 0) + Math.max(0, Number(s.duration_seconds ?? 0))
    if (Number(s.page_views ?? 1) <= 1 && Number(s.interactions ?? 0) === 0) {
      rec.bounces = (rec.bounces ?? 0) + 1
    }
    daily.set(k, rec)
  }
  ;(sessions ?? []).forEach(sessionsFor)

  // ---- source breakdown (from sessions) ----
  const sources = new Map<
    string,
    { sessions: number; pageViews: number; bounces: number; timeSeconds: number }
  >()
  for (const s of sessions ?? []) {
    const src = s.source || 'direct'
    const row = sources.get(src) ?? { sessions: 0, pageViews: 0, bounces: 0, timeSeconds: 0 }
    row.sessions++
    row.pageViews += Number(s.page_views ?? 1)
    if (Number(s.page_views ?? 1) <= 1 && Number(s.interactions ?? 0) === 0) row.bounces++
    row.timeSeconds += Math.max(0, Number(s.duration_seconds ?? 0))
    sources.set(src, row)
  }

  // ---- devices (device from sessions; os/browser from session_start events) ----
  const deviceAgg = new Map<string, { sessions: number; pageViews: number; conversions: number }>()
  const osAgg = new Map<string, { sessions: number; pageViews: number; conversions: number }>()
  const browserAgg = new Map<string, { sessions: number; pageViews: number; conversions: number }>()
  const bucketAgg = (map: Map<string, { sessions: number; pageViews: number; conversions: number }>, key: string, s: any) => {
    const row = map.get(key) ?? { sessions: 0, pageViews: 0, conversions: 0 }
    row.sessions++
    row.pageViews += Number(s.page_views ?? 1)
    if (convSessions.has(String(s.session_id ?? ''))) row.conversions++
    map.set(key, row)
  }
  for (const s of sessions ?? []) {
    bucketAgg(deviceAgg, s.device || 'unknown', s)
    const ob = osBySession.get(String(s.session_id ?? ''))
    bucketAgg(osAgg, ob?.os ?? 'unknown', s)
    bucketAgg(browserAgg, ob?.browser ?? 'unknown', s)
  }

  // ---- locations ----
  const locations = new Map<string, { sessions: number; pageViews: number; conversions: number; cities: Map<string, { sessions: number; pageViews: number; conversions: number }> }>()
  for (const s of sessions ?? []) {
    const country = String(s.country ?? 'unknown')
    const city = String(s.city ?? 'unknown')
    const row =
      locations.get(country) ?? {
        sessions: 0,
        pageViews: 0,
        conversions: 0,
        cities: new Map<string, { sessions: number; pageViews: number; conversions: number }>(),
      }
    row.sessions++
    row.pageViews += Number(s.page_views ?? 1)
    if (convSessions.has(String(s.session_id ?? ''))) row.conversions++
    const c = row.cities.get(city) ?? { sessions: 0, pageViews: 0, conversions: 0 }
    c.sessions++
    c.pageViews += Number(s.page_views ?? 1)
    if (convSessions.has(String(s.session_id ?? ''))) c.conversions++
    row.cities.set(city, c)
    locations.set(country, row)
  }

  // ---- upsert daily rows ----
  for (const [key, rec] of daily) {
    const [source, device, country] = key.split('|')
    const unique_visitors = (uniqueBy[key] ?? new Set()).size
    if ((rec.page_views ?? 0) === 0 && (rec.sessions ?? 0) === 0) continue
    await db.from('analytics_daily').upsert(
      {
        date,
        source,
        device,
        country,
        visitors: rec.sessions ?? 0,
        unique_visitors,
        sessions: rec.sessions ?? 0,
        page_views: rec.page_views ?? 0,
        bounces: rec.bounces ?? 0,
        session_seconds: rec.session_seconds ?? 0,
        affiliate_clicks: rec.affiliate_clicks ?? 0,
        add_to_cart: rec.add_to_cart ?? 0,
        checkouts: rec.checkouts ?? 0,
        newsletter_subscribes: rec.newsletter_subscribes ?? 0,
        newsletter_shown: rec.newsletter_shown ?? 0,
      },
      { onConflict: 'date,source,device,country' },
    )
  }

  // ---- upsert per-page rows ----
  for (const [page, rec] of pages) {
    await db.from('analytics_pages_daily').upsert(
      {
        date,
        page,
        views: rec.views ?? 0,
        unique_views: (uniquePages.get(page) ?? new Set()).size,
        time_on_page_seconds: rec.time_on_page_seconds ?? 0,
        exits: rec.exits ?? 0,
        referral_hits: rec.referral_hits ?? 0,
      },
      { onConflict: 'date,page' },
    )
  }

  // ---- build summary payload (v2) ----
  const dailyRows = [...daily.values()]
  const sum = (f: string) => dailyRows.reduce((a, r) => a + Number(r[f] ?? 0), 0)
  const bySource: Record<string, number> = {}
  dailyRows.forEach((r) => {
    const src = r.source || 'direct'
    bySource[src] = (bySource[src] ?? 0) + Number(r.page_views ?? 0)
  })

  const payload: Record<string, unknown> = {
    version: REPORT_VERSION,
    date,
    page_views: sum('page_views'),
    visitors: sum('visitors'),
    unique_visitors: sum('unique_visitors'),
    sessions: sum('sessions'),
    affiliate_clicks: sum('affiliate_clicks'),
    add_to_cart: sum('add_to_cart'),
    newsletter_subscribes: sum('newsletter_subscribes'),
    newsletter_shown: sum('newsletter_shown'),
    session_seconds: sum('session_seconds'),
    bounce_rate: sum('sessions') > 0 ? Math.round(((sum('bounces') / sum('sessions')) * 100) * 10) / 10 : 0,
    top_pages: [...pages.entries()]
      .sort((a, b) => Number(b[1].views ?? 0) - Number(a[1].views ?? 0))
      .slice(0, 10)
      .map(([p, rec]) => ({ page: p, views: rec.views })),
    by_source: bySource,
    sources: [...sources.entries()].map(([source, s]) => ({
      source,
      sessions: s.sessions,
      pageViews: s.pageViews,
      bounces: s.bounces,
      timeSeconds: s.timeSeconds,
      adds: sourceEvents.get(source)?.adds ?? 0,
      clicks: sourceEvents.get(source)?.clicks ?? 0,
      subs: sourceEvents.get(source)?.subs ?? 0,
    })),
    products: [...products.entries()].slice(0, 300).map(([slug, c]) => ({ slug, views: c.views, add: c.add, clicks: c.clicks })),
    categories: [...categories.entries()].slice(0, 100).map(([slug, c]) => ({ slug, views: c.views, clicks: c.clicks })),
    blogPosts: [...blogPosts.entries()].slice(0, 300).map(([slug, b]) => ({ slug, views: b.views, cardClicks: b.cardClicks, deepReads: b.deepReads, timeSeconds: b.timeSeconds, timeCount: b.timeCount })),
    search: {
      product: [...searchProduct.entries()].slice(0, 300).map(([term, a]) => ({ term, searches: a.searches, noResults: a.noResults, clickThroughs: a.clickThroughs })),
      blog: [...searchBlog.entries()].slice(0, 300).map(([term, a]) => ({ term, searches: a.searches, noResults: a.noResults, clickThroughs: a.clickThroughs })),
      productClicks: [...searchProductClicks.entries()].slice(0, 300).map(([slug, clicks]) => ({ slug, clicks })),
      blogClicks: [...searchBlogClicks.entries()].slice(0, 300).map(([slug, clicks]) => ({ slug, clicks })),
    },
    faq: [...faq.values()].slice(0, 300),
    newsletter: [...newsletter.entries()].map(([location, n]) => ({ location, shown: n.shown, subscribes: n.subscribes })),
    sePages: [...sePages.entries()].slice(0, 300).map(([page, r]) => ({
      page,
      googleViews: r.googleViews,
      bingViews: r.bingViews,
      ddgViews: r.ddgViews,
      googleSessions: r.sessions.get('google')?.size ?? 0,
      bingSessions: r.sessions.get('bing')?.size ?? 0,
      ddgSessions: r.sessions.get('duckduckgo')?.size ?? 0,
    })),
    devices: {
      devices: [...deviceAgg.entries()].map(([key, a]) => ({ key, sessions: a.sessions, pageViews: a.pageViews, conversions: a.conversions })),
      os: [...osAgg.entries()].map(([key, a]) => ({ key, sessions: a.sessions, pageViews: a.pageViews, conversions: a.conversions })),
      browsers: [...browserAgg.entries()].map(([key, a]) => ({ key, sessions: a.sessions, pageViews: a.pageViews, conversions: a.conversions })),
    },
    locations: [...locations.entries()]
      .slice(0, 200)
      .map(([country, r]) => ({
        country,
        sessions: r.sessions,
        pageViews: r.pageViews,
        conversions: r.conversions,
        cities: [...r.cities.entries()].slice(0, 15).map(([city, c]) => ({ city, sessions: c.sessions, pageViews: c.pageViews, conversions: c.conversions })),
      })),
  }

  const { error: reportError } = await db.from('analytics_reports').insert({ date, payload })
  if (reportError) throw reportError

  return { date, events: eventCount, payload }
}

function metricFor(event: string): string | null {
  if (event === 'page_view') return 'page_views'
  if (CLICK_EVENTS.has(event)) return 'affiliate_clicks'
  if (event === 'add_to_cart') return 'add_to_cart'
  if (event === 'checkout_view') return 'checkouts'
  if (event === 'newsletter_subscribe') return 'newsletter_subscribes'
  if (event === 'newsletter_popup_shown' || event === 'newsletter_shown') return 'newsletter_shown'
  return null
}

/** Aggregate a range of days (most recent first handled by caller). */
export async function aggregateRange(days: number): Promise<{ date: string; events: number }[]> {
  const db = getDb()
  const dates = lastNDates(days)
  const out: { date: string; events: number }[] = []
  for (const d of dates) {
    try {
      const res = await aggregateDay(d, db)
      out.push({ date: res.date, events: res.events })
    } catch (err) {
      console.error('aggregate error for', d, err)
      out.push({ date: d, events: -1 })
    }
  }
  return out
}
