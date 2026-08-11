'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/useCart'
import { track } from '@/lib/tracking'

const BN_ITEMS = [
  {
    label: 'Home',
    href: '/',
    active: (p: string) => p === '/',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    label: 'Category',
    href: '/shop',
    active: (p: string) => p.startsWith('/shop'),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Offer',
    href: '/deals',
    active: (p: string) => p.startsWith('/deals'),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.5 12.5 12 3a2 2 0 0 1 1.4-.6H20a2 2 0 0 1 2 2v6.6a2 2 0 0 1-.6 1.4L12.5 21.5a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1 0-2.8z" />
        <circle cx="17" cy="7" r="1" />
      </svg>
    ),
  },
]

export default function MobileBottomNav() {
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { count } = useCart()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!isMobile) return null

  return (
    <nav className="mobile-bottom-nav" aria-label="Bottom navigation">
      {BN_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bn-item${item.active(pathname) ? ' active' : ''}`}
          onClick={() =>
            track('bottom_nav_click', item.href, { label: item.label })
          }
        >
          {item.icon}
          <span className="bn-label">{item.label}</span>
        </Link>
      ))}
      <Link
        href="/cart"
        className={`bn-item bn-cart${pathname.startsWith('/cart') ? ' active' : ''}`}
        aria-label={`Cart (${count} items)`}
        onClick={() => track('bottom_nav_click', '/cart', { label: 'Cart' })}
      >
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
        {count > 0 && <span className="bn-cart-count">{count}</span>}
        <span className="bn-label">Cart</span>
      </Link>
    </nav>
  )
}
