import Link from 'next/link'

const PILLS = [
  { icon: '📝', label: 'Buying Guides', href: '/blog' },
  { icon: '🔥', label: 'Deals', href: '/shop/flash-sale' },
  { icon: '⭐', label: 'Reviews', href: '/blog' },
  { icon: '🛒', label: 'Shop', href: '/shop' },
]

export default function QuickPills() {
  return (
    <section className="quick-pills-section">
      <div className="container">
        <nav className="quick-pills" aria-label="Quick links">
          {PILLS.map((pill) => (
            <Link key={pill.label} href={pill.href} className="quick-pill">
              <span aria-hidden="true">{pill.icon}</span>
              {pill.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
