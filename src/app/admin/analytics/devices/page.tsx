import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getDeviceAnalytics, getMissingAnalyticsDays } from '@/lib/analytics-queries'
import AnalyticsNav from '../AnalyticsNav'
import ExportButtons from '../ExportButtons'
import AnalyticsBackfill from '../AnalyticsBackfill'

export const runtime = 'nodejs'
export const metadata: Metadata = { title: 'Device Analytics — GadgetErea Admin' }

const RANGES = [7, 30, 90] as const

function fmtNum(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

const OS_LABELS: Record<string, string> = {
  windows: 'Windows',
  macos: 'macOS',
  ios: 'iOS (iPhone / iPad / iPod)',
  android: 'Android',
  linux: 'Linux',
  unknown: 'Unknown',
}

export default async function DevicesPage({
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

  let devices: Awaited<ReturnType<typeof getDeviceAnalytics>> | null = null
  let missingDays: string[] = []
  try {
    ;[devices, missingDays] = await Promise.all([
      getDeviceAnalytics(range),
      getMissingAnalyticsDays(range),
    ])
  } catch (err) {
    console.error('device analytics failed', err)
  }

  const maxSessions = Math.max(
    1,
    ...(devices?.devices.map((d) => d.sessions) ?? [1]),
  )
  const maxOsSessions = Math.max(1, ...(devices?.os.map((d) => d.sessions) ?? [1]))
  const mobile = devices?.devices.find((d) => d.key === 'mobile') ?? null
  const desktop = devices?.devices.find((d) => d.key === 'desktop') ?? null
  const tablet = devices?.devices.find((d) => d.key === 'tablet') ?? null

  return (
    <section className="admin container">
      <div className="admin-shell">
        <div className="admin-main">
          <div className="admin-topbar">
            <h1 className="admin-title">Device Analytics</h1>
            <div className="admin-topbar-right">
              <Link href="/admin" className="btn btn-outline">
                ← Back
              </Link>
            </div>
          </div>

          <AnalyticsNav active="devices" />

          <AnalyticsBackfill missing={missingDays.length} range={range} />

          <div className="an-range-tabs">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics/devices?range=${r}`}
                className={`an-range-tab${range === r ? ' active' : ''}`}
              >
                Last {r} days
              </Link>
            ))}
          </div>

          <ExportButtons range={range} scope="devices" />

          {!devices ? (
            <p className="an-empty">Could not load device data.</p>
          ) : (
            <>
              <div className="an-section">
                <h2>Device Distribution</h2>
                {devices.devices.length === 0 ? (
                  <p className="an-empty">No sessions in this range.</p>
                ) : (
                  <>
                    <div className="an-rows">
                      {devices.devices.map((d) => (
                        <div className="an-row" key={d.key}>
                          <span className="an-row-name">{d.key}</span>
                          <div className="an-bar">
                            <div
                              className="an-bar-fill"
                              style={{
                                width: `${Math.max(3, (d.sessions / maxSessions) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="an-row-value">
                            {fmtNum(d.sessions)}
                            <small>
                              {' '}
                              {d.sessions
                                ? Math.round(
                                    (d.sessions /
                                      devices.devices.reduce(
                                        (s, x) => s + x.sessions,
                                        0,
                                      )) * 100,
                                  )
                                : 0}
                              %
                            </small>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="an-half-grid">
                      <div className="admin-card">
                        <strong>{mobile ? mobile.conversionRate + '%' : '—'}</strong>
                        <span>Mobile conversion</span>
                        <small className="admin-card-trend">
                          {mobile ? `${mobile.conversions}/${mobile.sessions} sessions` : 'no mobile data'}
                        </small>
                      </div>
                      <div className="admin-card">
                        <strong>{desktop ? desktop.conversionRate + '%' : '—'}</strong>
                        <span>Desktop conversion</span>
                        <small className="admin-card-trend">
                          {desktop ? `${desktop.conversions}/${desktop.sessions} sessions` : 'no desktop data'}
                        </small>
                      </div>
                      <div className="admin-card">
                        <strong>{tablet ? tablet.conversionRate + '%' : '—'}</strong>
                        <span>Tablet conversion</span>
                        <small className="admin-card-trend">
                          {tablet ? `${tablet.conversions}/${tablet.sessions} sessions` : 'no tablet data'}
                        </small>
                      </div>
                      <div className="admin-card">
                        <strong>
                          {mobile && desktop && mobile.sessions + desktop.sessions > 0
                            ? (() => {
                                const rate =
                                  (mobile.conversionRate / Math.max(0.1, desktop.conversionRate)) * 100
                                return rate >= 100 ? '+' + Math.round(rate - 100) + '%' : Math.round(rate - 100) + '%'
                              })()
                            : '—'}
                        </strong>
                        <span>Mobile vs Desktop</span>
                        <small className="admin-card-trend">
                          mobile rate relative to desktop
                        </small>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="an-section">
                <h2>Operating Systems</h2>
                {devices.os.length === 0 ? (
                  <p className="an-empty">No OS data in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>OS</th>
                          <th>Sessions</th>
                          <th>Page Views</th>
                          <th>Conversions</th>
                          <th>Conv %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.os.map((d) => (
                          <tr key={d.key}>
                            <td>
                              <div className="an-mini-bar">
                                <div
                                  className="an-bar-fill"
                                  style={{
                                    width: `${(d.sessions / maxOsSessions) * 100}%`,
                                  }}
                                />
                              </div>
                              {OS_LABELS[d.key] ?? d.key}
                            </td>
                            <td>{fmtNum(d.sessions)}</td>
                            <td>{fmtNum(d.pageViews)}</td>
                            <td>{d.conversions}</td>
                            <td>{d.conversionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="an-section">
                <h2>Browsers</h2>
                {devices.browsers.length === 0 ? (
                  <p className="an-empty">No browser data in this range.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Browser</th>
                          <th>Sessions</th>
                          <th>Page Views</th>
                          <th>Conversions</th>
                          <th>Conv %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.browsers.map((d) => (
                          <tr key={d.key}>
                            <td>{d.key}</td>
                            <td>{fmtNum(d.sessions)}</td>
                            <td>{fmtNum(d.pageViews)}</td>
                            <td>{d.conversions}</td>
                            <td>{d.conversionRate}%</td>
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
