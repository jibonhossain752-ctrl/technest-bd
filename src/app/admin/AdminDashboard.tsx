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

interface AdminMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊', href: '#overview' },
  { id: 'users', label: 'Users', icon: '👥', href: '#users' },
  { id: 'orders', label: 'Orders', icon: '📦', href: '#orders' },
  { id: 'messages', label: 'Contact Messages', icon: '✉️', href: '#messages' },
  { id: 'blog', label: 'Blog Posts', icon: '📰', href: '/blog' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/faq' },
]

const CARD_ICONS = [
  { icon: '👥', cls: 'card-orange' },
  { icon: '📦', cls: 'card-yellow' },
  { icon: '✉️', cls: 'card-navy' },
  { icon: '💰', cls: 'card-orange' },
]

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
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [error, setError] = useState('')
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [uRes, oRes, mRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/messages'),
      ])
      if (uRes.status === 401 || oRes.status === 401 || mRes.status === 401) {
        router.push('/admin/login')
        return
      }
      const [uJson, oJson, mJson] = await Promise.all([
        uRes.json(),
        oRes.json(),
        mRes.json(),
      ])
      if (!uRes.ok || !oRes.ok || !mRes.ok) throw new Error()
      setUsers(uJson.users ?? [])
      setOrders(oJson.orders ?? [])
      setMessages(mJson.messages ?? [])
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

  const handleSidebarItem = (item: (typeof SIDEBAR_ITEMS)[number]) => {
    setActive(item.id)
    setSidebarOpen(false)
  }

  const cards = [
    { value: users.length, label: 'Registered Users', trend: '+2 this week' },
    { value: orders.length, label: 'Total Orders', trend: '5 pending' },
    { value: messages.length, label: 'Contact Messages', trend: 'newest first' },
    {
      value: formatBDT(orders.reduce((sum, o) => sum + Number(o.total), 0)),
      label: 'Ordered Value',
      trend: 'all time',
    },
  ]

  return (
    <section className="admin container">
      <div className="admin-shell">
        <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="admin-sidebar-brand">
            <span className="logo-mark">N</span>
            TechNest<span>BD</span> Admin
          </div>
          <nav className="admin-sidebar-nav" aria-label="Admin navigation">
            {SIDEBAR_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`admin-sidebar-item${active === item.id ? ' active' : ''}`}
                onClick={() => handleSidebarItem(item)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="admin-sidebar-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="admin-sidebar-overlay"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="admin-main">
          <div className="admin-topbar">
            <button
              type="button"
              className="admin-hamburger"
              aria-label="Toggle sidebar"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
            <h1 className="admin-title">
              {SIDEBAR_ITEMS.find((i) => i.id === active)?.label ??
                'Overview'}
            </h1>
            <div className="admin-topbar-right">
              <button
                type="button"
                className="admin-bell"
                aria-label="Notifications"
              >
                🔔
              </button>
              <span className="admin-avatar" aria-hidden="true">
                A
              </span>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="admin-content">
            <div className="admin-cards" id="overview">
              {cards.map((card, i) => (
                <div className="admin-card" key={card.label}>
                  <span
                    className={`admin-card-icon ${CARD_ICONS[i % CARD_ICONS.length].cls}`}
                    aria-hidden="true"
                  >
                    {CARD_ICONS[i % CARD_ICONS.length].icon}
                  </span>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                  <small className="admin-card-trend">{card.trend}</small>
                </div>
              ))}
            </div>

            <div className="admin-section" id="users">
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

            <div className="admin-section" id="orders">
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
                              className={`admin-status status-${o.status}`}
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

            <div className="admin-section" id="messages">
              <h2>Contact Messages</h2>
              {messages.length === 0 ? (
                <p className="admin-empty">No messages yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((m) => (
                        <tr key={m.id}>
                          <td>{m.name}</td>
                          <td>{m.email}</td>
                          <td>{m.subject}</td>
                          <td className="admin-msg-cell">{m.message}</td>
                          <td>{fmtDate(m.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
