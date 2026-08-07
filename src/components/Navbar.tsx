'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/useCart'
import { useAuth } from '@/context/useAuth'
import SocialIcon from './SocialIcon'
import type { PlatformKey } from '@/lib/socials'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Shop', href: '/shop' },
  { label: 'Deals', href: '/deals' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const MENU_LINKS = [
  { icon: '🏠', label: 'Home', href: '/' },
  { icon: '🛍️', label: 'Shop', href: '/shop' },
  { icon: '📰', label: 'Blog', href: '/blog' },
  { icon: '🔥', label: 'Deals', href: '/deals' },
  { icon: '🆕', label: 'New Arrivals', href: '/shop/new-arrivals' },
  { icon: '⚡', label: 'Flash Sale', href: '/shop/flash-sale' },
]

const COMPANY_LINKS = [
  { icon: 'ℹ️', label: 'About', href: '/about' },
  { icon: '📞', label: 'Contact', href: '/contact' },
]

const SIDEBAR_SOCIALS: PlatformKey[] = ['facebook', 'instagram', 'whatsapp', 'youtube', 'pinterest']

export default function Navbar() {
  const { count } = useCart()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deskSidebarOpen, setDeskSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!user) return
    const stored = window.localStorage.getItem('technest-avatar')
    if (stored) setAvatar(stored)
  }, [user])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  useEffect(() => {
    const anyOpen = menuOpen || deskSidebarOpen
    if (!anyOpen) return
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setDeskSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, deskSidebarOpen])

  const closeMenu = () => setMenuOpen(false)

  const goHomeFresh = (e: React.MouseEvent) => {
    closeMenu()
    e.preventDefault()
    // Full page navigation (always reloads) so widgets/data fetch fresh,
    // even when already on the Home page.
    window.location.href = '/'
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const desktopNavList = (
    <ul className="nav-links nav-inline">
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={isActive(link.href) ? 'active' : ''}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )

  const sidePanel = (
    <aside
      className={`side-panel ${menuOpen ? 'open' : ''}`}
      aria-label="Site navigation"
      aria-hidden={!menuOpen}
    >
      <div className="side-panel-top">
        <Link href="/" className="side-logo" onClick={goHomeFresh}>
          <span className="logo-mark">N</span>
          TechNest<span>BD</span>
        </Link>
        <button
          type="button"
          className="side-close"
          aria-label="Close menu"
          onClick={closeMenu}
        >
          ✕
        </button>
      </div>
      <div className="side-divider" />

      <span className="side-label">Menu</span>
      <ul className="side-links">
        {MENU_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              onClick={closeMenu}
            >
              <span className="side-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="side-divider" />
      <span className="side-label">Company</span>
      <ul className="side-links">
        {COMPANY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              onClick={closeMenu}
            >
              <span className="side-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="side-foot">
        <div className="side-socials">
          {SIDEBAR_SOCIALS.map((platform) => (
            <SocialIcon key={platform} platform={platform} className="side-social" />
          ))}
        </div>
        <Link
          href={user ? '/account' : '/login'}
          className="side-account"
          onClick={closeMenu}
        >
          <span aria-hidden="true">👤</span>
          {user ? 'My Account' : 'Login / Register'}
        </Link>
      </div>
    </aside>
  )

  const overlay = (
    <div
      className={`nav-overlay ${menuOpen ? 'open' : ''}`}
      aria-hidden="true"
      onClick={closeMenu}
    />
  )

  const deskOverlay = (
    <div
      className={`desk-overlay ${deskSidebarOpen ? 'open' : ''}`}
      aria-hidden="true"
      onClick={() => setDeskSidebarOpen(false)}
    />
  )

  const deskPanel = (
    <aside
      className={`desk-panel ${deskSidebarOpen ? 'open' : ''}`}
      aria-label="Community & links"
    >
      <div className="desk-panel-head">
        <span className="desk-panel-title">Explore</span>
        <button
          type="button"
          className="desk-panel-close"
          aria-label="Close panel"
          onClick={() => setDeskSidebarOpen(false)}
        >
          ✕
        </button>
      </div>

      <span className="side-label">Menu</span>
      <ul className="side-links">
        {[
          { icon: '🏠', label: 'Home', href: '/' },
          { icon: '🆕', label: 'New Arrivals', href: '/shop/new-arrivals' },
          { icon: '⚡', label: 'Flash Sale', href: '/shop/flash-sale' },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              onClick={() => setDeskSidebarOpen(false)}
            >
              <span className="side-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="side-divider" />
      <span className="side-label desk-community-label">Community</span>
      <a
        href="https://chat.whatsapp.com/G5i6PUKjtlX34htXhvnKHc?s=sh&p=a&ilr=0"
        target="_blank"
        rel="noreferrer"
        className="desk-community-link"
      >
        <span className="desk-community-icon" aria-hidden="true">
          💬
        </span>
        Join WhatsApp Community
      </a>
      <a
        href="https://www.facebook.com/amazonfindsgadget.shop"
        target="_blank"
        rel="noreferrer"
        className="desk-community-link"
      >
        <span className="desk-community-icon" aria-hidden="true">
          👍
        </span>
        Join Facebook Community
      </a>

      <div className="desk-newsletter-mini">
        <h4>Newsletter Quick Subscribe</h4>
        <div className="desk-nl-form">
          <input
            type="email"
            placeholder="Your email"
            aria-label="Email for newsletter"
          />
          <button type="submit" className="btn btn-accent desk-nl-btn">
            Subscribe
          </button>
        </div>
      </div>

      <div className="side-divider" />
      <span className="side-label">Company</span>
      <ul className="side-links">
        {COMPANY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              onClick={() => setDeskSidebarOpen(false)}
            >
              <span className="side-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="desk-panel-foot">
        <div className="side-socials">
          {SIDEBAR_SOCIALS.map((platform) => (
            <SocialIcon key={platform} platform={platform} className="side-social" />
          ))}
        </div>
      </div>
    </aside>
  )

  return (
    <header
      className={`header${menuOpen || deskSidebarOpen ? ' menu-locked' : ''}`}
    >
      <div className="topbar">
        <p>Free delivery on orders over BDT 5,000 across Bangladesh</p>
      </div>

      <nav className="navbar">
        <div className="container nav-container">
          <Link href="/" className="logo" onClick={goHomeFresh}>
            <span className="logo-mark">N</span>
            TechNest<span>BD</span>
          </Link>

          {!isMobile && desktopNavList}

          {typeof document !== 'undefined' &&
            isMobile &&
            menuOpen &&
            createPortal(
              <>
                {sidePanel}
                {overlay}
              </>,
              document.body,
            )}

          {typeof document !== 'undefined' &&
            !isMobile &&
            deskSidebarOpen &&
            createPortal(
              <>
                {deskPanel}
                {deskOverlay}
              </>,
              document.body,
            )}

          <div className="nav-actions">
            {user ? (
              <Link
                href="/account"
                className={`user-chip${avatar ? ' has-avatar' : ' avatar-only'}`}
                aria-label="Account"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="user-avatar-img" />
                ) : (
                  <span className="user-avatar">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            ) : (
              <Link href="/account" className="icon-btn" aria-label="Account">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
              className={`menu-toggle ${
                (isMobile ? menuOpen : deskSidebarOpen) ? 'open' : ''
              }`}
              aria-label={
                isMobile
                  ? menuOpen
                    ? 'Close menu'
                    : 'Open menu'
                  : deskSidebarOpen
                    ? 'Close panel'
                    : 'Open panel'
              }
              aria-expanded={isMobile ? menuOpen : deskSidebarOpen}
              onClick={() =>
                isMobile
                  ? setMenuOpen((open) => !open)
                  : setDeskSidebarOpen((open) => !open)
              }
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
