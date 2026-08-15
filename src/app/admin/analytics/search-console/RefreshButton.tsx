'use client'

import { useState } from 'react'

export default function RefreshButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const run = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/analytics/search-console', {
        method: 'POST',
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({
          ok: true,
          text: 'Refreshed — new data from Google Search Console is cached. Reloading…',
        })
        setTimeout(() => window.location.reload(), 1200)
      } else if (res.status === 429) {
        setMsg({ ok: false, text: json.error ?? 'Refresh rate-limited.' })
      } else {
        setMsg({
          ok: false,
          text:
            json.error ?? 'Refresh failed — check the Search Console sync status above.',
        })
      }
    } catch {
      setMsg({ ok: false, text: 'Refresh failed — network error.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={run}
        disabled={busy}
      >
        {busy ? 'Refreshing…' : 'Refresh from Google'}
      </button>
      {msg && (
        <span className={`gsc-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</span>
      )}
    </>
  )
}
