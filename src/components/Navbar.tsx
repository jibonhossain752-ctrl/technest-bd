'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/useCart'
import { useAuth } from '@/context/useAuth'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
  { label: 'Flash Sale', href: '/shop/flash-sale' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Blog', href: '/blog' },
]

export default function Navbar() {
  const { count } = useCart()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!menuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="header">
      <div className="topbar">
        <p>Free delivery on orders over BDT 5,000 across Bangladesh</p>
      </div>

      <nav className="navbar">
        <div className="container nav-container">
          <Link href="/" className="logo" onClick={closeMenu}>
            <span className="logo-mark">N</span>
            TechNest<span>BD</span>
          </Link>

          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <li className="drawer-head">
              <span className="drawer-title">Menu</span>
              <button
                type="button"
                className="drawer-close"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                ✕
              </button>
            </li>
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={active ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div
            className={`nav-overlay ${menuOpen ? 'open' : ''}`}
            aria-hidden="true"
            onClick={closeMenu}
          />

          <div className="nav-actions">
            {user ? (
              <Link href="/account" className="user-chip" aria-label="Account">
                <span className="user-avatar">
                  {user.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link href="/account" className="icon-btn" aria-label="Account">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            )}
            <Link href="/cart" className="icon-btn cart-btn" aria-label="Cart">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <AnimatePresence mode="popLayout">
                {count > 0 && (
                  <motion.span
                    key={count}
                    className="cart-count"
                    initial={{ scale: 0.4, y: -8 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 16,
                    }}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              aria-label="Menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
