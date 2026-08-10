import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import {
  getSearchRankings,
  getSearchClickRank,
  getFaqExpandRanking,
  getFaqGoogleTraffic,
  getSearchEngineTraffic,
} from '@/lib/analytics-queries'
import AnalyticsNav from '../AnalyticsNav'
import ExportButtons from '../ExportButtons'

export const runtime = 'nodejs'
export const metadata: Metadata = { title: 'Search & FAQ Analytics — GadgetErea Admin' }

const RANGES = [7, 30, 90] as const

function fmtNum(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) redirect('/admin/login')

  const params = await searchParams
  const raw = Number(params.range)
  const range = (RANGES.includes(raw as (typeof RANGES)[number]) ? raw : 30) as
    | 7
    | 30
    | 90

  let searchRanks: Awaited<ReturnType<typeof getSearchRankings>> | null = null
  let clickRank: Awaited<ReturnType<typeof getSearchClickRank>> | null = null
  let faqExpands: Awaited<ReturnType<typeof getFaqExpandRanking>> | null = null
  let faqGoogle: Awaited<ReturnType<typeof getFaqGoogleTraffic>> | null = null
  let engineTraffic: Awaited<ReturnType<typeof getSearchEngineTraffic>> | null = null
  try {
    ;[searchRanks, clickRank, faqExpands, faqGoogle, engineTraffic] =
      await Promise.all([
        getSearchRankings(range),
        getSearchClickRank(range),
        getFaqExpandRanking(range),
        getFaqGoogleTraffic(range),
        getSearchEngineTraffic(range),
      ])
  } catch (err) {
    console.error('search analytics failed', err)
  }

  const allSearches =
    (searchRanks?.product.reduce((s, t) => s + t.searches, 0) ?? 0) +
    (searchRanks?.blog.reduce((s, t) => s + t.searches, 0) ?? 0)
  const noResultCount =
    (searchRanks?.product.reduce((s, t) => s + t.noResults, 0) ?? 0) +
    (searchRanks?.blog.reduce((s, t) => s + t.noResults, 0) ?? 0)
  const clickThroughCount =
    (searchRanks?.product.reduce((s, t) => s + t.clickThrough, 0) ?? 0) +
    (searchRanks?.blog.reduce((s, t) => s + t.clickThrough, 0) ?? 0)
  const clickAfterRate = allSearches ? Math.round((clickThroughCount / allSearches) * 100) : 0

  return (
    <section className="admin container">
      <div className="admin-shell">
        <div className="admin-main">
          <div className="admin-topbar">
            <h1 className="admin-title">Search & FAQ Analytics</h1>
            <div className="admin-topbar-right">
              <Link href="/admin" className="btn btn-outline">
                ← Back
              </Link>
            </div>
          </div>

          <AnalyticsNav active="search" />

          <div className="an-range-tabs">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics/search?range=${r}`}
                className={`an-range-tab${range === r ? ' active' : ''}`}
              >
                Last {r} days
              </Link>
            ))}
          </div>

          <ExportButtons range={range} scope="search" />

          {!searchRanks ? (
            <p className="an-empty">Could not load search data.</p>
          ) : (
            <>
              <div className="an-cards">
                <div className="admin-card">
                  <strong>{fmtNum(allSearches)}</strong>
                  <span>Total Searches</span>
                  <small className="admin-card-trend">product + blog</small>
                </div>
                <div className="admin-card">
                  <strong>{fmtNum(noResultCount)}</strong>
                  <span>No-Result Searches</span>
                  <small className="admin-card-trend">
                    {allSearches ? Math.round((noResultCount / allSearches) * 100) : 0}% of
                    searches
                  </small>
                </div>
                <div className="admin-card">
                  <strong>{clickAfterRate}%</strong>
                  <span>Click-After-Search</span>
                  <small className="admin-card-trend">
                    {clickThroughCount} clicks within 60s of a search
                  </small>
                </div>
              </div>

              <div className="an-section">
                <h2>Product Search Rank</h2>
                {searchRanks.product.length === 0 ? (
                  <p className="an-empty">No product searches in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Term</th>
                          <th>Searches</th>
                          <th>No Results</th>
                          <th>Click-Through</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchRanks.product.map((t) => (
                          <tr key={t.term}>
                            <td>{t.term}</td>
                            <td>{t.searches}</td>
                            <td>{t.noResults}</td>
                            <td>{t.clickThrough}</td>
                            <td>{t.clickRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Blog Search Rank</h2>
                {searchRanks.blog.length === 0 ? (
                  <p className="an-empty">No blog searches in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Term</th>
                          <th>Searches</th>
                          <th>No Results</th>
                          <th>Click-Through</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchRanks.blog.map((t) => (
                          <tr key={t.term}>
                            <td>{t.term}</td>
                            <td>{t.searches}</td>
                            <td>{t.noResults}</td>
                            <td>{t.clickThrough}</td>
                            <td>{t.clickRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Search-to-Click Rank</h2>
                {(!clickRank || (clickRank.product.length === 0 && clickRank.blog.length === 0)) ? (
                  <p className="an-empty">No clicks detected after searches yet.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Kind</th>
                          <th>Result</th>
                          <th>Clicks After Search</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clickRank.product.map((p) => (
                          <tr key={'p-' + p.slug}>
                            <td>Product</td>
                            <td>
                              <Link href={`/product/${p.slug}`}>{p.name}</Link>
                            </td>
                            <td>{p.clicks}</td>
                          </tr>
                        ))}
                        {clickRank.blog.map((b) => (
                          <tr key={'b-' + b.slug}>
                            <td>Blog post</td>
                            <td>
                              <Link href={`/blog/${b.slug}`}>{b.name}</Link>
                            </td>
                            <td>{b.clicks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>FAQ Question Rank (in-website)</h2>
                {!faqExpands || faqExpands.length === 0 ? (
                  <p className="an-empty">No FAQ expands in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>Expands</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqExpands.map((f) => (
                          <tr key={f.question}>
                            <td>{f.question}</td>
                            <td>{f.count}</td>
                            <td>{f.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Search Engine Traffic per Page</h2>
                <p className="an-note">
                  Method: Search Console is not connected — organic traffic is
                  approximated from referral headers (<code>source=google</code> /
                  Google, Bing, DuckDuckGo referrers).
                </p>
                {!engineTraffic || engineTraffic.length === 0 ? (
                  <p className="an-empty">No search-engine traffic in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th>Views</th>
                          <th>Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {engineTraffic.map((g) => (
                          <tr key={g.page}>
                            <td>{g.page}</td>
                            <td>{g.googleViews}</td>
                            <td>{g.googleSessions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>FAQ Google Traffic</h2>
                <p className="an-note">
                  Method: Search Console is not connected — Google traffic is
                  approximated from sessions attributed to <code>source=google</code>{' '}
                  (referrer/UTM proxy).
                </p>
                {!faqGoogle || faqGoogle.length === 0 ? (
                  <p className="an-empty">No Google-attributed FAQ traffic in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th>Views</th>
                          <th>Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqGoogle.map((g) => (
                          <tr key={g.page}>
                            <td>{g.page}</td>
                            <td>{g.views}</td>
                            <td>{g.sessions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
