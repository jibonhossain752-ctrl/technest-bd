import Link from 'next/link'
import CategoryScrollHint from './CategoryScrollHint'

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
        <div className="quick-pills-wrap">
          <nav className="quick-pills" aria-label="Quick links">
            {PILLS.map((pill) => (
              <Link key={pill.label} href={pill.href} className="quick-pill">
                <span aria-hidden="true">{pill.icon}</span>
                {pill.label}
              </Link>
            ))}
          </nav>
          <CategoryScrollHint targetSelector=".quick-pills" />
        </div>
      </div>
    </section>
  )
}
