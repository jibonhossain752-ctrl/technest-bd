'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/useAuth'
import { getOrdersByEmail } from '@/lib/orders'
import { formatBDT } from '@/data/products'
import type { OrderRecord } from '@/lib/orders'

const MENU = [
  { href: '/cart', label: '🛒 My Cart' },
  { href: '/checkout', label: '💳 Checkout' },
  { href: '/faq', label: '❓ Help & FAQ' },
  { href: '/contact', label: '📞 Support' },
  { href: '/blog', label: '📰 Blog' },
]

export default function AccountPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const initials = useMemo(() => {
    if (!user) return 'TN'
    const parts = user.name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
  }, [user])

  const [orders, setOrders] = useState<OrderRecord[]>([])

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setOrders([])
      return
    }
    getOrdersByEmail(user.email).then((list) => {
      if (!cancelled) setOrders(list)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <>
      <section className="account container">
        <div className="account-card">
          {user ? (
            <>
              <div className="account-user">
                <span className="avatar avatar-lg">{initials}</span>
                <div>
                  <h2>{user.name}</h2>
                  <p className="account-email">{user.email}</p>
                  {user.phone && <p className="account-phone">📞 {user.phone}</p>}
                  <p className="account-since">
                    Member since{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="account-section">
                <h3>My Orders</h3>
                {orders.length === 0 ? (
                  <p className="account-empty">
                    You have no orders yet.{' '}
                    <Link href="/shop">Start shopping</Link>
                  </p>
                ) : (
                  <div className="order-list">
                    {orders.map((order) => (
                      <div className="order-row" key={order.id}>
                        <div>
                          <strong>{order.id}</strong>
                          <small>
                            {new Date(order.placedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </small>
                        </div>
                        <span className="order-items">
                          {order.items.reduce((sum, i) => sum + i.qty, 0)} item(s)
                        </span>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                        <strong>{formatBDT(order.total)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="account-section">
                <h3>Settings</h3>
                <p className="account-empty">
                  Account preferences are managed from your profile. For
                  password or data changes,{' '}
                  <Link href="/contact">contact support</Link>.
                </p>
              </div>

              <div className="account-grid">
                {MENU.map((item) => (
                  <Link href={item.href} className="account-link" key={item.href}>
                    {item.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>

              <div className="account-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="account-user">
                <span className="avatar avatar-lg">TN</span>
                <div>
                  <h2>Welcome to TechNest BD</h2>
                  <p>
                    Sign in to view your profile, orders and preferences.
                  </p>
                </div>
              </div>

              <div className="account-grid">
                {MENU.map((item) => (
                  <Link href={item.href} className="account-link" key={item.href}>
                    {item.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>

              <div className="account-actions">
                <Link href="/login" className="btn btn-primary">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-outline">
                  Create Account
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
