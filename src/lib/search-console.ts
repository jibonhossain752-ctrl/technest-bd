/**
 * Google Search Console integration (server-only).
 *
 * Credentials come from environment variables ONLY (never from files):
 *   GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_PROJECT_ID (optional),
 *   GSC_SITE_URL (default 'sc-domain:gadgeterea.com')
 *
 * The dashboard never calls Google live — a daily cron syncs a snapshot
 * into the `search_console_cache` table, and admin pages read that cache.
 */

import { google } from 'googleapis'
import { getDb } from '@/lib/supabase'

export type GscErrorKind =
  | 'no_credentials'
  | 'no_access'
  | 'quota'
  | 'api'
  | 'table_missing'

export interface GscError {
  kind: GscErrorKind
  message: string
  at: string
}

export interface GscRow {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscSnapshot {
  site_url: string
  fetched_at: string
  totals: GscRow
  trend: (GscRow & { date: string })[]
  queries: (GscRow & { query: string })[]
  pages: (GscRow & { page: string })[]
  sitemaps: {
    path: string
    status: string
    errors: number
    warnings: number
    isPending: boolean
    lastSubmitted: string | null
  }[]
  inspections: {
    page: string
    coverage: string
    indexingState: string
    pageFetchState: string
    robotsTxtState: string
    lastCrawlTime: string | null
  }[]
}

const SNAPSHOT_ID = 'snapshot'

export function gscEnvPresent(): boolean {
  return !!(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY)
}

function siteUrl(): string {
  return process.env.GSC_SITE_URL || 'sc-domain:gadgeterea.com'
}

function privateKey(): string | undefined {
  const v = process.env.GSC_PRIVATE_KEY
  if (!v) return undefined
  if (v.startsWith('"')) {
    try {
      return JSON.parse(v)
    } catch {
      /* fall through to raw value */
    }
  }
  return v
}

export async function getScClient() {
  if (!gscEnvPresent()) {
    const e = new Error(
      'GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY are not configured. Add them to the environment (Vercel project settings or .env.local).',
    ) as Error & { gscKind: GscErrorKind }
    e.gscKind = 'no_credentials'
    throw e
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GSC_CLIENT_EMAIL,
      private_key: privateKey(),
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  return google.searchconsole({ version: 'v1', auth })
}

/** Map any thrown error to a stable, human-readable GscError. */
export function classifyGscError(err: unknown): GscError {
  const e = err as {
    gscKind?: GscErrorKind
    response?: { status?: number; data?: { error?: { message?: string; code?: string } } }
    status?: number
    code?: string | number
    message?: string
  }
  const status = e?.response?.status ?? e?.status ?? e?.code
  const msg =
    e?.response?.data?.error?.message ?? e?.message ?? String(err)
  const lower = String(msg).toLowerCase()
  const at = new Date().toISOString()

  if (e?.gscKind === 'no_credentials') {
    return { kind: 'no_credentials', message: msg, at }
  }
  if (
    status === 403 &&
    (lower.includes('permission') || lower.includes('not permitted'))
  ) {
    return {
      kind: 'no_access',
      message: `The Search Console service account (${
        process.env.GSC_CLIENT_EMAIL ?? 'unknown'
      }) does not have access to the verified property yet. Add it in Search Console → Settings → Users and permissions, then refresh.`,
      at,
    }
  }
  if (
    (status === 429 || lower.includes('quota') || lower.includes('rate limit')) &&
    !lower.includes('search_console_cache')
  ) {
    return {
      kind: 'quota',
      message:
        'Google Search Console API quota exceeded. Google resets this daily — try again later.',
      at,
    }
  }
  if (
    lower.includes('search_console_cache') &&
    (lower.includes('does not exist') ||
      lower.includes('could not find the table') ||
      e?.response?.data?.error?.code === 'PGRST205' ||
      (e as { code?: string }).code === 'PGRST205' ||
      lower.includes('pgrst205'))
  ) {
    return {
      kind: 'table_missing',
      message:
        'The search_console_cache table does not exist yet. Run the SQL migration in supabase/search_console.sql via the Supabase SQL editor, then refresh.',
      at,
    }
  }
  return { kind: 'api', message: msg, at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(r: any): GscRow {
  return {
    clicks: Math.round(Number(r?.clicks ?? 0)),
    impressions: Math.round(Number(r?.impressions ?? 0)),
    ctr: Number(((r?.ctr ?? 0) * 100).toFixed(2)),
    position: Number((r?.position ?? 0).toFixed(1)),
  }
}

/**
 * Fetch a full snapshot from the Search Console API for the last 28 days:
 * totals, daily trend, top queries, top pages, sitemap status, and index
 * coverage for the top pages (URL inspection). Bounded and safe to run
 * inside the daily cron.
 */
export async function fetchGscSnapshot(): Promise<GscSnapshot> {
  const sc = await getScClient()
  const site = siteUrl()
  const end = new Date()
  const start = new Date(end.getTime() - 27 * 86400000)
  const df = (d: Date) => d.toISOString().slice(0, 10)
  const base = { startDate: df(start), endDate: df(end) }

  const [totalsRes, trendRes, queriesRes, pagesRes, sitemapsRes] =
    await Promise.all([
      sc.searchanalytics.query({
        siteUrl: site,
        requestBody: { ...base, dimensions: [], rowLimit: 1 },
      }),
      sc.searchanalytics.query({
        siteUrl: site,
        requestBody: { ...base, dimensions: ['date'], rowLimit: 28 },
      }),
      sc.searchanalytics.query({
        siteUrl: site,
        requestBody: { ...base, dimensions: ['query'], rowLimit: 500 },
      }),
      sc.searchanalytics.query({
        siteUrl: site,
        requestBody: { ...base, dimensions: ['page'], rowLimit: 500 },
      }),
      sc.sitemaps.list({ siteUrl: site }),
    ])

  const sitemaps = (sitemapsRes.data.sitemap ?? []).map((s) => {
    const errs = Number(s.errors ?? 0)
    const status = s.isPending
      ? 'Pending'
      : errs > 0
        ? 'Errors'
        : 'Success'
    return {
      path: s.path ?? '',
      status,
      errors: errs,
      warnings: Number(s.warnings ?? 0),
      isPending: !!s.isPending,
      lastSubmitted: s.lastSubmitted ?? null,
    }
  })

  // Index coverage for the top pages (bounded, sequential; a single failed
  // inspection must never fail the whole snapshot).
  const topPages = (pagesRes.data.rows ?? [])
    .map((r) => r.keys?.[0])
    .filter((p): p is string => !!p)
    .slice(0, 25)
  const inspections: GscSnapshot['inspections'] = []
  for (const page of topPages) {
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: page,
          siteUrl: site,
          languageCode: 'en-US',
        },
      })
      const st = res.data.inspectionResult?.indexStatusResult
      inspections.push({
        page,
        coverage: st?.coverageState ?? 'UNKNOWN',
        indexingState: st?.indexingState ?? 'UNKNOWN',
        pageFetchState: st?.pageFetchState ?? 'UNKNOWN',
        robotsTxtState: st?.robotsTxtState ?? 'UNKNOWN',
        lastCrawlTime: st?.lastCrawlTime ?? null,
      })
    } catch {
      /* keep going */
    }
  }

  return {
    site_url: site,
    fetched_at: new Date().toISOString(),
    totals: toRow(totalsRes.data.rows?.[0]),
    trend: (trendRes.data.rows ?? []).map((r) => ({
      date: r.keys?.[0] ?? '',
      ...toRow(r),
    })),
    queries: (queriesRes.data.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? '',
      ...toRow(r),
    })),
    pages: (pagesRes.data.rows ?? []).map((r) => ({
      page: r.keys?.[0] ?? '',
      ...toRow(r),
    })),
    sitemaps,
    inspections,
  }
}

/** Read the cached snapshot (admin dashboard display path — no Google calls). */
export async function getSearchConsoleSnapshot(
  db = getDb(),
): Promise<{ snapshot: GscSnapshot | null; lastError: GscError | null }> {
  const { data, error } = await db
    .from('search_console_cache')
    .select('totals, trend, queries, pages, sitemaps, inspections, site_url, fetched_at, last_error')
    .eq('id', SNAPSHOT_ID)
    .maybeSingle()
  if (error) {
    const msg = String(error.message ?? '')
    if (
      msg.toLowerCase().includes('search_console_cache') &&
      (msg.toLowerCase().includes('could not find the table') ||
        msg.toLowerCase().includes('does not exist') ||
        msg.toLowerCase().includes('pgrst205'))
    ) {
      return {
        snapshot: null,
        lastError: {
          kind: 'table_missing',
          message:
            'The search_console_cache table does not exist yet. Run the SQL migration in supabase/search_console.sql via the Supabase SQL editor.',
          at: new Date().toISOString(),
        },
      }
    }
    throw error
  }
  if (!data) return { snapshot: null, lastError: null }
  const s = data as {
    totals: GscSnapshot['totals'] | null
    trend: GscSnapshot['trend'] | null
    queries: GscSnapshot['queries'] | null
    pages: GscSnapshot['pages'] | null
    sitemaps: GscSnapshot['sitemaps'] | null
    inspections: GscSnapshot['inspections'] | null
    site_url: string | null
    fetched_at: string | null
    last_error: GscError | null
  }
  if (!s.totals && !s.last_error) {
    return { snapshot: null, lastError: null }
  }
  const snapshot: GscSnapshot | null = s.totals
    ? {
        site_url: s.site_url ?? '',
        fetched_at: s.fetched_at ?? '',
        totals: s.totals,
        trend: s.trend ?? [],
        queries: s.queries ?? [],
        pages: s.pages ?? [],
        sitemaps: s.sitemaps ?? [],
        inspections: s.inspections ?? [],
      }
    : null
  return { snapshot, lastError: s.last_error ?? null }
}

/**
 * Fetch fresh data from Google and cache it. Stores the error state in the
 * same row on failure so the dashboard can render a clear message without
 * calling Google again. Never throws — returns { ok, error }.
 */
export async function syncSearchConsoleSnapshot(
  db = getDb(),
): Promise<{ ok: boolean; snapshot?: GscSnapshot; error?: GscError }> {
  const row = {
    id: SNAPSHOT_ID,
    site_url: siteUrl(),
    last_error: null,
  } as Record<string, unknown>
  try {
    const snapshot = await fetchGscSnapshot()
    Object.assign(row, {
      site_url: snapshot.site_url,
      fetched_at: snapshot.fetched_at,
      totals: snapshot.totals,
      trend: snapshot.trend,
      queries: snapshot.queries,
      pages: snapshot.pages,
      sitemaps: snapshot.sitemaps,
      inspections: snapshot.inspections,
    })
    const { error } = await db.from('search_console_cache').upsert(row)
    if (error) throw error
    return { ok: true, snapshot }
  } catch (err) {
    const gscErr = classifyGscError(err)
    try {
      await db
        .from('search_console_cache')
        .upsert({ id: SNAPSHOT_ID, last_error: gscErr })
    } catch {
      /* if the table itself is missing, the dashboard reports it from the
         classifyGscError path below */
    }
    return { ok: false, error: gscErr }
  }
}
