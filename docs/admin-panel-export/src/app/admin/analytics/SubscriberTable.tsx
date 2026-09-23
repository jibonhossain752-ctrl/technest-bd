'use client'

import { useEffect, useRef, useState } from 'react'
import type { SortKey, SortDir, Subscriber } from './subscriber-types'

export default function SubscriberTable() {
  const [rows, setRows] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('created_at')
  const [dir, setDir] = useState<SortDir>('desc')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = (q: string, s: SortKey, d: SortDir) => {
    setLoading(true)
    setError('')
    fetch(
      `/api/admin/newsletter/subscribers?search=${encodeURIComponent(q)}&sort=${s}&dir=${d}`,
    )
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error('Unauthorized')
        }
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? 'Could not load.')
        setRows(json.subscribers ?? [])
        setTotal(json.total ?? 0)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load.')
        setRows([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(search, sort, dir)
  }, [sort, dir])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => load(search, sort, dir), 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [search])

  const toggleSort = (key: SortKey) => {
    if (key === sort) {
      setDir(dir === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(key)
      setDir('asc')
    }
  }

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th>
      <button
        type="button"
        className={`an-sort-btn${sort === k ? ` an-sort-${dir}` : ''}`}
        onClick={() => toggleSort(k)}
      >
        {label}
        <span className="an-sort-caret">{sort === k ? (dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </button>
    </th>
  )

  return (
    <div className="an-sub-block">
      <div className="an-toolbar">
        <input
          type="search"
          className="an-search-input"
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search subscribers"
        />
        <a
          className="btn btn-accent"
          href="/api/admin/newsletter/subscribers?format=csv"
        >
          ⬇ Export CSV
        </a>
      </div>
      <p className="an-toolbar-note">
        {loading
          ? 'Loading…'
          : `${rows.length} of ${total} subscriber${total === 1 ? '' : 's'}`}
      </p>
      {error ? (
        <p className="an-empty">{error}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <Th label="Email" k="email" />
                <Th label="Name" k="name" />
                <Th label="Phone" k="phone" />
                <Th label="Country" k="country" />
                <Th label="Source" k="source" />
                <Th label="Subscribed" k="created_at" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="an-empty">
                    {search
                      ? 'No subscribers match that search.'
                      : 'No subscribers yet — signups appear here automatically.'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.email}>
                    <td>{r.email}</td>
                    <td>{r.name || '—'}</td>
                    <td>{r.phone || '—'}</td>
                    <td>
                      {r.country
                        ? `${r.country}${r.city ? ` · ${r.city}` : ''}`
                        : '—'}
                    </td>
                    <td>
                      <span className="an-chip">{r.source}</span>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}