import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getLocationAnalytics } from '@/lib/analytics-queries'
import AnalyticsNav from '../AnalyticsNav'
import ExportButtons from '../ExportButtons'

export const runtime = 'nodejs'
export const metadata: Metadata = { title: 'Location Analytics — TechNest Admin' }

const RANGES = [7, 30, 90] as const

function fmtNum(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

export default async function LocationsPage({
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

  let locations: Awaited<ReturnType<typeof getLocationAnalytics>> | null = null
  try {
    locations = await getLocationAnalytics(range)
  } catch (err) {
    console.error('location analytics failed', err)
  }

  const maxSessions = Math.max(1, ...(locations?.map((l) => l.sessions) ?? [1]))
  const totalSessions = locations?.reduce((s, l) => s + l.sessions, 0) ?? 0

  return (
    <section className="admin container">
      <div className="admin-shell">
        <div className="admin-main">
          <div className="admin-topbar">
            <h1 className="admin-title">Location Analytics</h1>
            <div className="admin-topbar-right">
              <Link href="/admin" className="btn btn-outline">
                ← Back
              </Link>
            </div>
          </div>

          <AnalyticsNav active="locations" />

          <div className="an-range-tabs">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics/locations?range=${r}`}
                className={`an-range-tab${range === r ? ' active' : ''}`}
              >
                Last {r} days
              </Link>
            ))}
          </div>

          <ExportButtons range={range} scope="locations" />

          {!locations ? (
            <p className="an-empty">Could not load location data.</p>
          ) : (
            <>
              <div className="an-cards">
                <div className="admin-card">
                  <strong>{fmtNum(totalSessions)}</strong>
                  <span>Sessions</span>
                  <small className="admin-card-trend">last {range} days</small>
                </div>
                <div className="admin-card">
                  <strong>{locations.length}</strong>
                  <span>Countries</span>
                  <small className="admin-card-trend">with sessions</small>
                </div>
              </div>

              <div className="an-section">
                <h2>Visitors by Country</h2>
                {locations.length === 0 ? (
                  <p className="an-empty">No sessions in this range.</p>
                ) : (
                  <div className="an-rows">
                    {locations.map((l) => (
                      <div className="an-row" key={l.country}>
                        <span className="an-row-name">
                          {l.countryName} <small>({l.country})</small>
                        </span>
                        <div className="an-bar">
                          <div
                            className="an-bar-fill"
                            style={{
                              width: `${Math.max(3, (l.sessions / maxSessions) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="an-row-value">{fmtNum(l.sessions)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Top Locations — Sessions, Views & Conversion</h2>
                {locations.length === 0 ? (
                  <p className="an-empty">No data in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th>Sessions</th>
                          <th>Page Views</th>
                          <th>Conversions</th>
                          <th>Conv %</th>
                          <th>Top Cities</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((l) => (
                          <tr key={l.country}>
                            <td>{l.countryName}</td>
                            <td>{fmtNum(l.sessions)}</td>
                            <td>{fmtNum(l.pageViews)}</td>
                            <td>{l.conversions}</td>
                            <td>{l.conversionRate}%</td>
                            <td>
                              {l.cities
                                .map((c) => `${c.city} (${c.sessions})`)
                                .join(', ') || '—'}
                            </td>
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
