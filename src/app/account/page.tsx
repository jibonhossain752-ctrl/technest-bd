'use client'

import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'

const MENU = [
  { href: '/account', label: '👤 Profile' },
  { href: '/cart', label: '🛒 My Cart' },
  { href: '/checkout', label: '💳 Checkout' },
  { href: '/faq', label: '❓ Help & FAQ' },
  { href: '/contact', label: '📞 Support' },
  { href: '/blog', label: '📰 Blog' },
]

export default function AccountPage() {
  return (
    <>
      <PageHeader title="My Account" subtitle="Manage your profile, orders and preferences" />

      <section className="account container">
        <div className="account-card">
          <div className="account-user">
            <span className="avatar avatar-lg">TN</span>
            <div>
              <h2>Welcome to TechNest BD</h2>
              <p>
                Sign in to manage your orders, address book and wishlist. This
                demo account area is ready to connect to your authentication
                backend.
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
        </div>
      </section>
    </>
  )
}
