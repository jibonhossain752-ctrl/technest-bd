import Link from 'next/link'
import SocialIcon from './SocialIcon'
import type { PlatformKey } from '@/lib/socials'

const SHOP_LINKS = [
  { label: 'Laptops', href: '/shop/laptops' },
  { label: 'Smartphones', href: '/shop/smartphones' },
  { label: 'Accessories', href: '/shop/accessories' },
  { label: 'Gaming', href: '/shop/gaming' },
]

const SUPPORT_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const ACCOUNT_LINKS = [
  { label: 'My Account', href: '/account' },
  { label: 'Login', href: '/login' },
  { label: 'Register', href: '/register' },
  { label: 'Cart', href: '/cart' },
]

const FOOTER_SOCIALS: PlatformKey[] = ['facebook', 'instagram', 'whatsapp', 'youtube', 'pinterest']

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gadgeterea-logo.png"
              alt="GadgetErea"
              width={106}
              height={36}
              className="logo-img"
            />
          </Link>
          <p>
            Your trusted tech destination in the USA. Genuine products, fair
            prices, and service you can rely on.
          </p>
          <div className="socials">
            {FOOTER_SOCIALS.map((platform) => (
              <SocialIcon key={platform} platform={platform} trackLocation="footer" />
            ))}
          </div>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 GadgetErea. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
