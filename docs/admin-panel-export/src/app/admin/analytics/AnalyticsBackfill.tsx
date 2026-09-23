'use client'

import { useEffect, useState } from 'react'

/**
 * Background backfill for missing analytics aggregation days. The server
 * pages always render from existing reports (never block on aggregation);
 * this component detects missing days and re-runs the aggregate route in
 * the background, then refreshes when the data is ready.
 */
export default function AnalyticsBackfill({
  missing,
  range,
}: {
  missing: number
  range: number
}) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (missing <= 0) return
    const storageKey = 'an_backfill_' + range
    let cancelled = false
    try {
      if (sessionStorage.getItem(storageKey)) return
    } catch {
      /* private mode — proceed anyway */
    }
    let attempts = 0
    const run = async () => {
      if (cancelled) return
      attempts++
      setBusy(true)
      try {
        const res = await fetch(
          '/api/admin/analytics/aggregate?days=' + range,
          { method: 'POST' },
        )
        const json = await res.json().catch(() => ({}))
        const remaining = Number(json?.remaining ?? 0)
        if (!res.ok) {
          setBusy(false)
          return
        }
        if (remaining > 0 && attempts < 8) {
          window.setTimeout(run, 2500)
          return
        }
        setBusy(false)
        try {
          sessionStorage.setItem(storageKey, '1')
        } catch {
          /* ignore */
        }
        if (!cancelled && remaining === 0) {
          window.location.reload()
        }
      } catch {
        setBusy(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing, range])

  if (missing <= 0 || !busy) return null

  return (
    <div className="an-note" role="status">
      Restoring missing analytics data ({missing} day{missing === 1 ? '' : 's'}) —
      page may refresh once it&rsquo;s ready.
    </div>
  )
}