'use client'

import { useEffect, useState } from 'react'

interface RecentEvent {
  event: string
  page: string | null
  source: string | null
  session_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
}

interface Snapshot {
  onlineNow: number
  recent: RecentEvent[]
  last24hClicks: number
  last24hViews: number
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function RealtimePanel() {
  const [snap, setSnap] = useState<Snapshot | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/admin/analytics/realtime')
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled) setSnap(json)
      } catch {
        /* ignore */
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return (
    <div className="an-section">
      <h2>Realtime (B7)</h2>
      {!snap ? (
        <p className="an-empty">Loading live data…</p>
      ) : (
        <div className="an-realtime">
          <div className="an-realtime-stats">
            <span className="an-live-dot" />
            <strong>{snap.onlineNow}</strong> online now · {snap.last24hViews} views
            · {snap.last24hClicks} affiliate clicks (24h)
          </div>
          <div className="an-realtime-feed">
            {snap.recent.length === 0 ? (
              <p className="an-empty">No events in the last 24 hours.</p>
            ) : (
              snap.recent.slice(0, 12).map((e, i) => (
                <div className="an-realtime-row" key={`${e.session_id}-${e.created_at}-${i}`}>
                  <span className="an-realtime-time">{fmtTime(e.created_at)}</span>
                  <span className="an-realtime-event">{e.event}</span>
                  <span className="an-realtime-page">{e.page ?? '/'}</span>
                  <span className="an-realtime-source">{e.source ?? 'direct'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
