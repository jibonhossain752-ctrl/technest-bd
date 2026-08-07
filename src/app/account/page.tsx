'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/useAuth'

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
                  <h2>Welcome to TechNest US</h2>
                  <p>
                    Sign in to view your profile and saved preferences.
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
