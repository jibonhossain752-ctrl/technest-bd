'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/useCart'
import { useAuth } from '@/context/useAuth'
import SocialIcon from './SocialIcon'
import type { PlatformKey } from '@/lib/socials'
import { track, pixelFor } from '@/lib/tracking'

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
  { icon: '📰', label: 'Blog', href: '/blog' },
  { icon: '🛍️', label: 'Shop', href: '/shop' },
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
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()

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
    setMobileSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileSearchOpen) return
    const onDown = (e: PointerEvent) => {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        track('header_search', undefined, { action: 'close_outside' })
        setMobileSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [mobileSearchOpen])

  useEffect(() => {
    if (!isMobile || !mobileSearchOpen) return
    const onPop = () => setMobileSearchOpen(false)
    window.history.pushState({ mobileSearch: true }, '')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [mobileSearchOpen, isMobile])

  useEffect(() => {
    const anyOpen = menuOpen || deskSidebarOpen || mobileSearchOpen
    if (!anyOpen) return
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setDeskSidebarOpen(false)
        setMobileSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, deskSidebarOpen, mobileSearchOpen])

  const closeMenu = () => setMenuOpen(false)

  const openMobileSearch = () => {
    if (!mobileSearchOpen) {
      track('header_search', undefined, { action: 'open' })
    }
    setMobileSearchOpen(true)
    mobileSearchInputRef.current?.focus()
  }

  const goHomeFresh = (e: React.MouseEvent) => {
    closeMenu()
    e.preventDefault()
    track('nav_logo_click')
    // Full page navigation (always reloads) so widgets/data fetch fresh,
    // even when already on the Home page.
    window.location.href = '/'
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const input = e.currentTarget.querySelector('input')
    const q = ((input as HTMLInputElement | null)?.value ?? searchQuery).trim()
    if (!q) return
    track('header_search', undefined, {
      query: q.slice(0, 100),
      destination: '/shop',
    })
    pixelFor('header_search', { query: q.slice(0, 100) })
    closeMenu()
    setDeskSidebarOpen(false)
    setSearchQuery('')
    router.push('/shop?q=' + encodeURIComponent(q))
  }

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gadgeterea-logo.png"
            alt="GadgetErea"
            width={94}
            height={32}
            className="logo-img"
          />
        </Link>
        <button
          type="button"
          className="side-close"
          aria-label="Close menu"
          onClick={() => {
            track('nav_menu_close')
            closeMenu()
          }}
        >
          ✕
        </button>
      </div>
      <div className="side-divider" />

      <form className="side-search" role="search" onSubmit={submitSearch}>
        <input
          type="search"
          placeholder="Search products…"
          aria-label="Search products"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" aria-label="Search">
          🔍
        </button>
      </form>

      <span className="side-label">Menu</span>
      <ul className="side-links">
        {MENU_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              onClick={() => {
                track('nav_menu_click', link.href, { label: link.label })
                closeMenu()
              }}
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
              onClick={() => {
                track('nav_menu_click', link.href, { label: link.label })
                closeMenu()
              }}
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
            <SocialIcon key={platform} platform={platform} className="side-social" trackLocation="navbar" />
          ))}
        </div>
        <Link
          href={user ? '/account' : '/login'}
          className="side-account"
          onClick={() => {
            track('nav_account_click')
            closeMenu()
          }}
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
          onClick={() => {
            track('nav_menu_close')
            setDeskSidebarOpen(false)
          }}
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
              onClick={() => {
                track('nav_menu_click', link.href, { label: link.label })
                setDeskSidebarOpen(false)
              }}
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
        onClick={() => {
          track('community_link_click', undefined, { platform: 'whatsapp' })
          pixelFor('community_link_click', { platform: 'whatsapp' })
        }}
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
        onClick={() => {
          track('community_link_click', undefined, { platform: 'facebook' })
          pixelFor('community_link_click', { platform: 'facebook' })
        }}
      >
        <span className="desk-community-icon" aria-hidden="true">
          👍
        </span>
        Join Facebook Community
      </a>

      <div className="desk-newsletter-mini">
        <h4>Newsletter Quick Subscribe</h4>
        <form
          className="desk-nl-form"
          onSubmit={(e) => {
            e.preventDefault()
            const email = String(
              new FormData(e.currentTarget).get('email') ?? '',
            ).trim()
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
            e.currentTarget.reset()
            track('newsletter_subscribe', undefined, { location: 'quick' })
            pixelFor('newsletter_subscribe', { email })
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Your email"
            aria-label="Email for newsletter"
          />
          <button
            type="submit"
            className="btn btn-accent desk-nl-btn"
            onClick={() => track('newsletter_quick_subscribe_click')}
          >
            Subscribe
          </button>
        </form>
      </div>

      <div className="side-divider" />
      <span className="side-label">Company</span>
      <ul className="side-links">
        {COMPANY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              onClick={() => {
                track('nav_menu_click', link.href, { label: link.label })
                setDeskSidebarOpen(false)
              }}
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
            <SocialIcon key={platform} platform={platform} className="side-social" trackLocation="navbar" />
          ))}
        </div>
      </div>
    </aside>
  )

  return (
    <header
      className={`header${menuOpen || deskSidebarOpen ? ' menu-locked' : ''}`}
    >
      <nav className="navbar">
        <div className="container nav-container">
          <Link
            href="/"
            className={`logo${mobileSearchOpen ? ' search-open' : ''}`}
            onClick={goHomeFresh}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gadgeterea-logo.png"
              alt="GadgetErea"
              width={129}
              height={44}
              className="logo-img"
            />
          </Link>

          {!isMobile && desktopNavList}

          {!isMobile && (
            <form className="header-search" role="search" onSubmit={submitSearch}>
              <input
                type="search"
                name="q"
                placeholder="Search products…"
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" aria-label="Search">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </form>
          )}

          {isMobile && (
            <div
              ref={mobileSearchRef}
              className={`m-search${mobileSearchOpen ? ' search-open' : ''}`}
              onClick={() => openMobileSearch()}
            >
              <form className="m-search-form" role="search" onSubmit={submitSearch}>
                <span className="m-search-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  placeholder="Search products…"
                  aria-label="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => openMobileSearch()}
                />
                {mobileSearchOpen && (
                  <button
                    type="button"
                    className="m-search-close"
                    aria-label="Close search"
                    onClick={(e) => {
                      e.stopPropagation()
                      track('header_search', undefined, { action: 'close' })
                      setMobileSearchOpen(false)
                    }}
                  >
                    ✕
                  </button>
                )}
              </form>
            </div>
          )}

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

          <div
            className={`nav-actions${mobileSearchOpen ? ' search-open' : ''}`}
          >
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
            {!isMobile && (
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
            )}
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
              onClick={() => {
                const opening = isMobile ? !menuOpen : !deskSidebarOpen
                if (opening) {
                  track('nav_hamburger_click', undefined, {
                    panel: isMobile ? 'mobile' : 'desktop',
                  })
                  if (!isMobile) {
                    // desktop panel contains the quick-subscribe newsletter box
                    track('newsletter_shown', undefined, { location: 'quick' })
                  }
                } else {
                  track('nav_menu_close')
                }
                if (isMobile) {
                  setMenuOpen((open) => !open)
                } else {
                  setDeskSidebarOpen((open) => !open)
                }
              }}
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
