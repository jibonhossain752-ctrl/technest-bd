import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import {
  getSearchConsoleSnapshot,
  gscEnvPresent,
  type GscSnapshot,
  type GscError,
} from '@/lib/search-console'
import AnalyticsNav from '../AnalyticsNav'
import RefreshButton from './RefreshButton'

export const runtime = 'nodejs'
export const metadata: Metadata = {
  title: 'Search Console — GadgetErea Admin',
}

const DAYS = 28

function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function coverageBadge(state: string): { cls: string; label: string } {
  const s = (state || '').toUpperCase()
  if (s.includes('INDEXED')) return { cls: 'ok', label: s.replace(/_/g, ' ') }
  if (s.includes('EXCLUDED')) return { cls: 'neutral', label: s.replace(/_/g, ' ') }
  if (s.includes('NOT_FOUND')) return { cls: 'err', label: 'Not found (404)' }
  return { cls: 'warn', label: s.replace(/_/g, ' ') || 'Unknown' }
}

export default async function SearchConsolePage() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) redirect('/admin/login')

  let snapshot: GscSnapshot | null = null
  let lastError: GscError | null = null
  let configured = gscEnvPresent()
  let failed = false
  try {
    const res = await getSearchConsoleSnapshot()
    snapshot = res.snapshot
    lastError = res.lastError
    configured = gscEnvPresent()
  } catch (err) {
    failed = true
    console.error('search console page failed', err)
  }

  const maxTrend = Math.max(
    1,
    ...(snapshot?.trend.map((t) => Math.max(t.clicks, t.impressions)) ?? [1]),
  )
  const indexed = (snapshot?.inspections ?? []).filter((i) =>
    (i.coverage || '').toUpperCase().includes('INDEXED'),
  ).length
  const issues = (snapshot?.inspections ?? []).filter(
    (i) => !(i.coverage || '').toUpperCase().includes('INDEXED'),
  )

  return (
    <section className="admin container">
      <div className="admin-shell">
        <div className="admin-main">
          <div className="admin-topbar">
            <h1 className="admin-title">Search Console</h1>
            <div className="admin-topbar-right">
              <Link href="/admin/analytics" className="btn btn-outline">
                ← Back
              </Link>
            </div>
          </div>

          <AnalyticsNav active="search-console" />

          <p className="gsc-meta">
            Google refreshes Search Console data once a day (1–3 day delay).
            The dashboard shows a cached snapshot synced by the daily cron —
            the Google API is never called on page load.
          </p>

          {failed && (
            <div className="gsc-error-box">
              <strong>Could not load the Search Console cache.</strong>
              The cache query failed. If this persists, check the server logs.
            </div>
          )}

          {!configured && (
            <div className="gsc-hint-box">
              <strong>Search Console API is not configured yet.</strong>
              Set <code>GSC_CLIENT_EMAIL</code>, <code>GSC_PRIVATE_KEY</code>,{' '}
              <code>GSC_PROJECT_ID</code> and <code>GSC_SITE_URL</code> in the
              Vercel project settings (and <code>.env.local</code> for local
              dev). The service-account JSON key file must never be committed
              to the repository.
            </div>
          )}

          {lastError && (
            <div className="gsc-error-box">
              <strong>Search Console sync error</strong>
              {lastError.message}
              <span className="gsc-meta">
                {' '}
                Last attempt: {fmtDate(lastError.at)}
              </span>
            </div>
          )}

          {snapshot ? (
            <>
              <div className="an-cards">
                <div className="admin-card">
                  <strong>{fmt(snapshot.totals.clicks)}</strong>
                  <span>Clicks ({DAYS} days)</span>
                  <small className="admin-card-trend">Google Search</small>
                </div>
                <div className="admin-card">
                  <strong>{fmt(snapshot.totals.impressions)}</strong>
                  <span>Impressions ({DAYS} days)</span>
                  <small className="admin-card-trend">Google Search</small>
                </div>
                <div className="admin-card">
                  <strong>{snapshot.totals.ctr}%</strong>
                  <span>Avg. CTR</span>
                  <small className="admin-card-trend">clicks ÷ impressions</small>
                </div>
                <div className="admin-card">
                  <strong>{snapshot.totals.position}</strong>
                  <span>Avg. position</span>
                  <small className="admin-card-trend">lower is better</small>
                </div>
              </div>

              <div className="an-section">
                <h2>Daily trend ({DAYS} days)</h2>
                {snapshot.trend.length === 0 ? (
                  <p className="an-empty">No trend data.</p>
                ) : (
                  <div className="an-trend">
                    {snapshot.trend.map((t) => (
                      <div className="an-trend-col" key={t.date}>
                        <div
                          className="an-bar"
                          title={`${t.date}: ${t.clicks} clicks, ${t.impressions} impressions`}
                        >
                          <div
                            className="an-bar-fill"
                            style={{
                              height: `${Math.max(
                                2,
                                (Math.max(t.clicks, t.impressions) / maxTrend) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="an-trend-date">
                          {t.date.slice(5).replace('-', '/')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Top search queries</h2>
                {snapshot.queries.length === 0 ? (
                  <p className="an-empty">No query data in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Query</th>
                          <th>Clicks</th>
                          <th>Impressions</th>
                          <th>CTR</th>
                          <th>Avg. Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.queries.slice(0, 100).map((q) => (
                          <tr key={q.query}>
                            <td>{q.query}</td>
                            <td>{fmt(q.clicks)}</td>
                            <td>{fmt(q.impressions)}</td>
                            <td>{q.ctr}%</td>
                            <td>{q.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Performance per page</h2>
                {snapshot.pages.length === 0 ? (
                  <p className="an-empty">No page data in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th>Clicks</th>
                          <th>Impressions</th>
                          <th>CTR</th>
                          <th>Avg. Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.pages.slice(0, 100).map((p) => (
                          <tr key={p.page}>
                            <td>
                              <a
                                href={p.page}
                                target="_blank"
                                rel="noreferrer"
                                className="gsc-page-link"
                              >
                                {p.page}
                              </a>
                            </td>
                            <td>{fmt(p.clicks)}</td>
                            <td>{fmt(p.impressions)}</td>
                            <td>{p.ctr}%</td>
                            <td>{p.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>
                  Index coverage{' '}
                  <span className="gsc-meta">
                    (top {snapshot.inspections.length} pages —{' '}
                    {indexed} indexed, {issues.length} not fully indexed)
                  </span>
                </h2>
                {snapshot.inspections.length === 0 ? (
                  <p className="an-empty">
                    No inspection data. (URL inspection is only available once
                    the sync runs with working credentials.)
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th>Coverage</th>
                          <th>Indexing</th>
                          <th>Last crawl</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.inspections.map((i) => {
                          const b = coverageBadge(i.coverage)
                          return (
                            <tr key={i.page}>
                              <td>{i.page}</td>
                              <td>
                                <span
                                  className={`gsc-badge ${b.cls}`}
                                >
                                  {b.label}
                                </span>
                              </td>
                              <td>{i.indexingState}</td>
                              <td>{fmtDate(i.lastCrawlTime)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Sitemap status</h2>
                {snapshot.sitemaps.length === 0 ? (
                  <p className="an-empty">No sitemaps reported.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Sitemap</th>
                          <th>Status</th>
                          <th>Errors</th>
                          <th>Warnings</th>
                          <th>Last submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.sitemaps.map((s) => (
                          <tr key={s.path}>
                            <td>
                              <code>{s.path}</code>
                            </td>
                            <td>
                              <span
                                className={`gsc-badge ${
                                  s.status === 'Success'
                                    ? 'ok'
                                    : s.isPending
                                      ? 'warn'
                                      : 'err'
                                }`}
                              >
                                {s.isPending ? 'Pending' : s.status}
                              </span>
                            </td>
                            <td>{s.errors}</td>
                            <td>{s.warnings}</td>
                            <td>{fmtDate(s.lastSubmitted)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Sync</h2>
                <p className="an-note">
                  Snapshot last fetched from Google:{' '}
                  <strong>{fmtDate(snapshot.fetched_at)}</strong> (cron runs
                  daily at 03:00 UTC; manual refresh is rate-limited to once
                  per 15 minutes).
                </p>
                <div style={{ marginTop: 10 }}>
                  <RefreshButton />
                </div>
              </div>
            </>
          ) : (
            !failed &&
            !configured &&
            !lastError && (
              <p className="an-empty">
                No Search Console data cached yet. The daily cron will populate
                this once the API credentials are configured and the sync
                succeeds.
              </p>
            )
          )}
        </div>
      </div>
    </section>
  )
}
