import Link from 'next/link'

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

const SOCIAL_LINKS = [
  { label: 'f', name: 'Facebook', href: 'https://www.facebook.com/amazonfindsgadget.shop' },
  { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com/amazonfindsgadget.shop/' },
  { label: 'WA', name: 'WhatsApp', href: 'https://chat.whatsapp.com/G5i6PUKjtlX34htXhvnKHc?s=sh&p=a&ilr=0' },
  { label: 'YT', name: 'YouTube', href: 'https://www.youtube.com/@amazonfindsgagdet' },
  { label: 'P', name: 'Pinterest', href: 'https://www.pinterest.com/amazonfinds_gadget/' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="logo">
            <span className="logo-mark">N</span>
            TechNest<span>BD</span>
          </Link>
          <p>
            Your trusted tech destination in Bangladesh. Genuine products, fair
            prices, and service you can rely on.
          </p>
          <div className="socials">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
              >
                {s.label}
              </a>
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
          <p>&copy; 2026 TechNest BD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
