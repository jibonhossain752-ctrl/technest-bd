'use client'

import { useState } from 'react'

export default function ReaggregateButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const run = async () => {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/analytics/aggregate?days=3', {
        method: 'POST',
      })
      if (!res.ok) {
        setMsg('Failed (' + res.status + ')')
      } else {
        setMsg('Done — reloading…')
        window.location.reload()
      }
    } catch {
      setMsg('Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span>
      <button
        type="button"
        className="btn btn-primary"
        onClick={run}
        disabled={busy}
      >
        {busy ? 'Aggregating…' : '↻ Re-aggregate (3d)'}
      </button>
      {msg && <small className="an-inline-msg">{msg}</small>}
    </span>
  )
}
