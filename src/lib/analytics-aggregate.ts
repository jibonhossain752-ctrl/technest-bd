import { getDb } from './supabase'
import { fetchEvents, CLICK_EVENTS } from './analytics-server'

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

/** Aggregate one day from raw events + sessions into analytics_daily / analytics_pages_daily. */
export async function aggregateDay(dateStr: string, db = getDb()): Promise<{ date: string; events: number }> {
  const { startIso, endIso } = dayRange(dateStr)

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

  await fetchEvents(startIso, endIso, async (rows) => {
    for (const r of rows) {
      eventCount++
      const k = keyOf(r)
      bump(daily, k, 'page_views', 0) // placeholder to create row
      // events map to metrics
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
    }
  })

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
    if ((Number(s.page_views ?? 1) <= 1) && (Number(s.interactions ?? 0) === 0)) {
      rec.bounces = (rec.bounces ?? 0) + 1
    }
    daily.set(k, rec)
  }
  ;(sessions ?? []).forEach(sessionsFor)

  // ---- upsert daily rows ----
  for (const [key, rec] of daily) {
    const [source, device, country] = key.split('|')
    const unique_visitors = (uniqueBy[key] ?? new Set()).size
    if ((rec.page_views ?? 0) === 0 && (rec.sessions ?? 0) === 0) continue
    await db.from('analytics_daily').upsert(
      {
        date: dateStr,
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
        date: dateStr,
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

  return { date: dateStr, events: eventCount }
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
      out.push(await aggregateDay(d, db))
    } catch (err) {
      console.error('aggregate error for', d, err)
      out.push({ date: d, events: -1 })
    }
  }
  return out
}

/** Build the daily summary report payload for a date. */
export async function buildDailyReportPayload(dateStr: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const { data: daily } = await db.from('analytics_daily').select('*').eq('date', dateStr)
  const rows = daily ?? []
  const sum = (f: string) => rows.reduce((a, r) => a + Number(r[f] ?? 0), 0)
  const { data: pages } = await db.from('analytics_pages_daily').select('*').eq('date', dateStr)
  const topPages = (pages ?? [])
    .sort((a, b) => Number(b.views ?? 0) - Number(a.views ?? 0))
    .slice(0, 10)
    .map((p) => ({ page: p.page, views: p.views }))
  const bySource: Record<string, number> = {}
  rows.forEach((r) => {
    bySource[r.source] = (bySource[r.source] ?? 0) + Number(r.page_views ?? 0)
  })
  return {
    date: dateStr,
    page_views: sum('page_views'),
    visitors: sum('visitors'),
    unique_visitors: sum('unique_visitors'),
    sessions: sum('sessions'),
    affiliate_clicks: sum('affiliate_clicks'),
    add_to_cart: sum('add_to_cart'),
    newsletter_subscribes: sum('newsletter_subscribes'),
    newsletter_shown: sum('newsletter_shown'),
    bounce_rate: sum('sessions') > 0 ? Math.round((sum('bounces') / sum('sessions') * 100) * 10) / 10 : 0,
    top_pages: topPages,
    by_source: bySource,
  }
}

/** Build and store the daily summary report for the latest aggregated date. */
export async function storeDailyReport(dateStr: string): Promise<boolean> {
  try {
    const db = getDb()
    const payload = await buildDailyReportPayload(dateStr)
    const { error } = await db.from('analytics_reports').insert({ date: dateStr, payload })
    if (error) throw error
    return true
  } catch (err) {
    console.error('storeDailyReport error', err)
    return false
  }
}
