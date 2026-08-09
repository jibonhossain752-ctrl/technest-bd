import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getDb } from '@/lib/supabase'
import {
  getTopProducts,
  getTopCategories,
  getTopBlogPosts,
  getSourceRankings,
  getFunnel,
  getDailyTrend,
  getTopPages,
  getSearchRankings,
  getFaqExpandRanking,
} from '@/lib/analytics-queries'
import RealtimePanel from './RealtimePanel'
import ReaggregateButton from './ReaggregateButton'
import AnalyticsNav from './AnalyticsNav'
import ExportButtons from './ExportButtons'

export const runtime = 'nodejs'
export const metadata: Metadata = { title: 'Analytics — TechNest Admin' }

const RANGES = [7, 30, 90] as const

function fmtNum(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

interface ReportRow {
  date: string
  createdAt: string
  visitors: number
  pageViews: number
  sessions: number
  affiliateClicks: number
  addToCart: number
  newsletterSubscribes: number
}

async function getReports(): Promise<ReportRow[]> {
  try {
    const db = getDb()
    const { data, error } = await db
      .from('analytics_reports')
      .select('date, created_at, payload')
      .order('date', { ascending: false })
      .limit(10)
    if (error) return []
    return (data ?? []).map((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>
      return {
        date: String(r.date).slice(0, 10),
        createdAt: r.created_at,
        visitors: Number(p.visitors ?? 0),
        pageViews: Number(p.page_views ?? 0),
        sessions: Number(p.sessions ?? 0),
        affiliateClicks: Number(p.affiliate_clicks ?? 0),
        addToCart: Number(p.add_to_cart ?? 0),
        newsletterSubscribes: Number(p.newsletter_subscribes ?? 0),
      }
    })
  } catch {
    return []
  }
}

function fmtDuration(seconds: number) {
  if (seconds <= 0) return '—'
  if (seconds < 60) return seconds + 's'
  return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's'
}

function Bar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0
  return (
    <div className="an-bar">
      <div className="an-bar-fill" style={{ width: `${pct}%` }} />
      {label && <span className="an-bar-label">{label}</span>}
    </div>
  )
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const raw = Number(params.range)
  const range = (RANGES.includes(raw as (typeof RANGES)[number]) ? raw : 7) as
    | 7
    | 30
    | 90

  const safe = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn()
    } catch (err) {
      console.error('analytics section failed', err)
      return [] as unknown as T
    }
  }

  const [products, categories, blogPosts, sources, funnel, trend, topPages, reports, searchRanks, faqExpands] =
    await Promise.all([
      safe(() => getTopProducts(range)),
      safe(() => getTopCategories(range)),
      safe(() => getTopBlogPosts(range)),
      safe(() => getSourceRankings(range)),
      safe(() => getFunnel(range)),
      safe(() => getDailyTrend(range)),
      safe(() => getTopPages(range)),
      getReports(),
      safe(() => getSearchRankings(range)),
      safe(() => getFaqExpandRanking(range)),
    ])

  const totalViews = trend.reduce((s, t) => s + t.pageViews, 0)
  const totalVisitors = trend.reduce((s, t) => s + t.visitors, 0)
  const totalClicks = trend.reduce((s, t) => s + t.affiliateClicks, 0)
  const maxViews = Math.max(1, ...trend.map((t) => t.pageViews))
  const maxSourcePerf = Math.max(1, ...sources.map((s) => s.performance))
  const maxCatViews = Math.max(1, ...categories.map((c) => c.views))
  const maxPageViews = Math.max(1, ...topPages.map((p) => p.count))

  return (
    <section className="admin container">
      <div className="admin-shell">
        <div className="admin-main">
          <div className="admin-topbar">
            <h1 className="admin-title">Analytics</h1>
            <div className="admin-topbar-right">
              <Link href="/admin" className="btn btn-outline">
                ← Back
              </Link>
            </div>
          </div>

          <AnalyticsNav active="overview" />

          <div className="an-range-tabs">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics?range=${r}`}
                className={`an-range-tab${range === r ? ' active' : ''}`}
              >
                Last {r} days
              </Link>
            ))}
          </div>

          <div className="an-cards">
            <div className="admin-card">
              <strong>{fmtNum(totalVisitors)}</strong>
              <span>Visitors</span>
              <small className="admin-card-trend">last {range} days</small>
            </div>
            <div className="admin-card">
              <strong>{fmtNum(totalViews)}</strong>
              <span>Page Views</span>
              <small className="admin-card-trend">last {range} days</small>
            </div>
            <div className="admin-card">
              <strong>{fmtNum(totalClicks)}</strong>
              <span>Affiliate Clicks</span>
              <small className="admin-card-trend">last {range} days</small>
            </div>
            <div className="admin-card">
              <strong>{fmtNum(sources.length ? sources[0].sessions : 0)}</strong>
              <span>Top Source Sessions</span>
              <small className="admin-card-trend">
                {sources[0] ? sources[0].source : 'no data'}
              </small>
            </div>
          </div>

          <RealtimePanel />

          <div className="an-section">
            <h2>Exports & Reports (F)</h2>
            <ExportButtons range={range} scope="daily" />
            <div className="an-export-bar an-export-bar-secondary">
              <ReaggregateButton />
            </div>
            {reports.length === 0 ? (
              <p className="an-empty">
                No scheduled reports yet — the daily cron (3 AM UTC) writes one
                per day.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Visitors</th>
                      <th>Views</th>
                      <th>Sessions</th>
                      <th>Affiliate Clicks</th>
                      <th>Add to Cart</th>
                      <th>Subscribes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.visitors}</td>
                        <td>{r.pageViews}</td>
                        <td>{r.sessions}</td>
                        <td>{r.affiliateClicks}</td>
                        <td>{r.addToCart}</td>
                        <td>{r.newsletterSubscribes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-content">
            <div className="an-section">
              <h2>Daily Trend</h2>
              {trend.length === 0 ? (
                <p className="an-empty">No data in this range yet.</p>
              ) : (
                <div className="an-trend">
                  {trend.map((t) => (
                    <div className="an-trend-col" key={t.date}>
                      <Bar value={t.pageViews} max={maxViews} />
                      <span className="an-trend-date">{t.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="an-section">
              <h2>Purchase Funnel (B6)</h2>
              {funnel.length === 0 ? (
                <p className="an-empty">No data in this range yet.</p>
              ) : (
                <div className="an-funnel">
                  {funnel.map((f, i) => {
                    const pct =
                      i === 0
                        ? 100
                        : funnel[0].count
                          ? Math.round((f.count / funnel[0].count) * 100)
                          : 0
                    return (
                      <div className="an-funnel-row" key={f.label}>
                        <span className="an-funnel-label">{f.label}</span>
                        <div className="an-funnel-bar">
                          <div
                            className="an-funnel-fill"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                        <span className="an-funnel-value">
                          {fmtNum(f.count)} <small>({pct}%)</small>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="an-section">
              <h2>Top Products (C1)</h2>
              {products.length === 0 ? (
                <p className="an-empty">No product events in this range.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Views</th>
                        <th>Add to Cart</th>
                        <th>Buy Clicks</th>
                        <th>Conv</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.slug}>
                          <td>
                            <Link href={`/product/${p.slug}`}>{p.name}</Link>
                          </td>
                          <td>{p.views}</td>
                          <td>{p.addToCart}</td>
                          <td>{p.clicks}</td>
                          <td>
                            {p.views
                              ? Math.round((p.conversions / p.views) * 100) + '%'
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="an-section">
              <h2>Top Categories (C2)</h2>
              {categories.length === 0 ? (
                <p className="an-empty">No category events in this range.</p>
              ) : (
                <div className="an-rows">
                  {categories.map((c) => (
                    <div className="an-row" key={c.slug}>
                      <span className="an-row-name">
                        {c.icon} {c.name}
                      </span>
                      <Bar value={c.views} max={maxCatViews} />
                      <span className="an-row-value">{fmtNum(c.views)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="an-section">
              <h2>Top Blog Posts (C3)</h2>
              {blogPosts.length === 0 ? (
                <p className="an-empty">No blog events in this range.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Post</th>
                        <th>Views</th>
                        <th>Card Clicks</th>
                        <th>Deep Reads</th>
                        <th>Avg Time</th>
                        <th>Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogPosts.map((b) => (
                        <tr key={b.slug}>
                          <td>
                            <Link href={`/blog/${b.slug}`}>{b.title}</Link>
                          </td>
                          <td>{b.views}</td>
                          <td>{b.cardClicks}</td>
                          <td>{b.deepReads}</td>
                          <td>{fmtDuration(b.avgSeconds)}</td>
                          <td>{b.engagement}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="an-section">
              <h2>Source Rankings (C4 / B6)</h2>
              {sources.length === 0 ? (
                <p className="an-empty">No traffic in this range yet.</p>
              ) : (
                <div className="an-rows">
                  {sources.map((s) => (
                    <div className="an-row" key={s.source}>
                      <span className="an-row-name">{s.source}</span>
                      <div className="an-source-meta">
                        {fmtNum(s.sessions)} sessions · {s.viewsPerSession}
                        /session · {fmtDuration(s.avgSeconds)} avg · {s.bounceRate}%
                        bounce · {s.affiliateClicks} clicks · {s.newsletterSubscribes}{' '}
                        subs
                      </div>
                      <Bar value={s.performance} max={maxSourcePerf} />
                      <span className="an-row-value">{s.performance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="an-section">
              <h2>Search & FAQ Rankings (C3)</h2>
              <div className="an-half-grid">
                <div className="an-panel">
                  <h3>Top Product Searches</h3>
                  {searchRanks.product.length === 0 ? (
                    <p className="an-empty">No product searches yet.</p>
                  ) : (
                    <div className="an-rows">
                      {searchRanks.product.slice(0, 5).map((t) => (
                        <div className="an-row" key={t.term}>
                          <span className="an-row-name">{t.term}</span>
                          <span className="an-row-value">
                            {fmtNum(t.searches)}
                            <small> {t.clickRate}% clicked</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="an-panel">
                  <h3>Top FAQ Expands</h3>
                  {faqExpands.length === 0 ? (
                    <p className="an-empty">No FAQ expands yet.</p>
                  ) : (
                    <div className="an-rows">
                      {faqExpands.slice(0, 5).map((f) => (
                        <div className="an-row" key={f.question}>
                          <span className="an-row-name">{f.question}</span>
                          <span className="an-row-value">{fmtNum(f.count)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="an-note">
                Full search-to-click, blog-search, FAQ and Google-traffic rankings live on the{' '}
                <Link href="/admin/analytics/search">Search &amp; FAQ page</Link>.
              </p>
            </div>

            <div className="an-section">
              <h2>Top Pages</h2>
              {topPages.length === 0 ? (
                <p className="an-empty">No page views in this range.</p>
              ) : (
                <div className="an-rows">
                  {topPages.map((p) => (
                    <div className="an-row" key={p.page}>
                      <span className="an-row-name">{p.page}</span>
                      <Bar value={p.count} max={maxPageViews} />
                      <span className="an-row-value">{fmtNum(p.count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
