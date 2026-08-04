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
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              f
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              IG
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
              YT
            </a>
            <a href="https://wa.me" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              WA
            </a>
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
