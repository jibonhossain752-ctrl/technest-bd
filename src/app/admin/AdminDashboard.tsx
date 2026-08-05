'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBDT } from '@/data/products'

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  subscribed: boolean
  createdAt: string
}

interface AdminOrder {
  id: string
  contact: { name: string; phone: string; email?: string }
  items: { name: string; qty: number; price: number }[]
  total: number
  status: string
  placedAt: string
}

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [uRes, oRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/orders'),
      ])
      if (uRes.status === 401 || oRes.status === 401) {
        router.push('/admin/login')
        return
      }
      const [uJson, oJson] = await Promise.all([uRes.json(), oRes.json()])
      if (!uRes.ok || !oRes.ok) throw new Error()
      setUsers(uJson.users ?? [])
      setOrders(oJson.orders ?? [])
    } catch {
      setError('Could not load dashboard data.')
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    )
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        setError('Could not update order status.')
        load()
      }
    } catch {
      setError('Could not update order status.')
      load()
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <section className="admin container">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">
            {users.length} registered user{users.length === 1 ? '' : 's'} ·{' '}
            {orders.length} order{orders.length === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-cards">
        <div className="admin-card">
          <strong>{users.length}</strong>
          <span>Registered Users</span>
        </div>
        <div className="admin-card">
          <strong>{orders.length}</strong>
          <span>Total Orders</span>
        </div>
        <div className="admin-card">
          <strong>
            {formatBDT(orders.reduce((sum, o) => sum + Number(o.total), 0))}
          </strong>
          <span>Ordered Value</span>
        </div>
      </div>

      <div className="admin-section">
        <h2>Registered Users</h2>
        {users.length === 0 ? (
          <p className="admin-empty">No users yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subscribed</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.subscribed ? 'Yes' : 'No'}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p className="admin-empty">No orders yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>
                      <strong>{o.contact.name}</strong>
                      <br />
                      <small>{o.contact.phone}</small>
                      {o.contact.email && (
                        <>
                          <br />
                          <small>{o.contact.email}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {o.items.map((i) => (
                        <div key={`${o.id}-${i.name}`}>
                          <small>
                            {i.qty} × {i.name} ({formatBDT(i.price)})
                          </small>
                        </div>
                      ))}
                    </td>
                    <td>{formatBDT(o.total)}</td>
                    <td>{fmtDate(o.placedAt)}</td>
                    <td>
                      <select
                        className="admin-status"
                        value={o.status}
                        onChange={(e) => setStatus(o.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
