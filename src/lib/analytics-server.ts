import { cookies } from 'next/headers'
import { ADMIN_COOKIE, verifySessionToken } from './admin-auth'
import { getDb } from './supabase'

export interface TrackInput {
  event: string
  page: string
  sessionId: string
  source?: string
  device?: string
  os?: string
  browser?: string
  country?: string
  city?: string
  url?: string
  refHost?: string
  utm?: { source?: string; medium?: string; campaign?: string }
  meta?: Record<string, unknown>
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value)
}

/** Insert a raw event and keep the session table in sync. */
export async function recordEvent(input: TrackInput) {
  const db = getDb()
  const now = new Date().toISOString()
  const meta = input.meta ?? {}

  const { error } = await db.from('analytics_events').insert({
    session_id: input.sessionId,
    user_id: null,
    event: input.event,
    page: input.page,
    source: input.source ?? 'direct',
    device: input.device ?? 'unknown',
    os: input.os ?? null,
    browser: input.browser ?? null,
    country: input.country ?? 'unknown',
    city: input.city ?? 'unknown',
    url: input.url ?? '',
    ref_host: input.refHost ?? null,
    utm_campaign: input.utm?.campaign ?? null,
    utm_medium: input.utm?.medium ?? null,
    utm_source: input.utm?.source ?? null,
    meta,
  })
  if (error) throw error

  const { data: existing } = await db
    .from('analytics_sessions')
    .select('session_id, page_views, interactions')
    .eq('session_id', input.sessionId)
    .maybeSingle()

  if (input.event === 'page_view' || input.event === 'session_start') {
    if (!existing) {
      await db.from('analytics_sessions').insert({
        session_id: input.sessionId,
        source: input.source ?? 'direct',
        device: input.device ?? 'unknown',
        country: input.country ?? 'unknown',
        city: input.city ?? 'unknown',
        landing_page: input.page,
        exit_page: input.page,
        started_at: now,
        last_activity: now,
        page_views: 1,
        interactions: 0,
        duration_seconds: 0,
      })
    } else {
      await db
        .from('analytics_sessions')
        .update({
          last_activity: now,
          exit_page: input.page,
          page_views: Number(existing.page_views ?? 1) + 1,
        })
        .eq('session_id', input.sessionId)
    }
  } else if (input.event === 'time_on_page' || input.event === 'page_exit') {
    const seconds = Math.max(0, Number(meta.seconds ?? 0) || 0)
    await db
      .from('analytics_sessions')
      .update({
        last_activity: now,
        exit_page: input.page,
        duration_seconds: seconds,
      })
      .eq('session_id', input.sessionId)
  } else {
    await db
      .from('analytics_sessions')
      .update({
        last_activity: now,
        exit_page: input.page,
        interactions: Number(existing?.interactions ?? 0) + 1,
      })
      .eq('session_id', input.sessionId)
  }

  return { ok: true }
}

const CLICK_EVENTS = new Set([
  'buy_now',
  'affiliate_click',
  'deal_price_click',
  'buy_on_amazon',
  'buy_all_amazon',
])

/** Fetch events in a window, in batches. */
export async function fetchEvents(
  startIso: string,
  endIso: string,
  onBatch: (rows: any[]) => Promise<void>,
) {
  const db = getDb()
  let offset = 0
  for (;;) {
    const { data, error } = await db
      .from('analytics_events')
      .select('*')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .order('id', { ascending: true })
      .range(offset, offset + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    await onBatch(data)
    if (data.length < 1000) break
    offset += 1000
  }
}

export { CLICK_EVENTS }
