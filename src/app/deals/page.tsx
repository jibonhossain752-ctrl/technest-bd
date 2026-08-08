import type { Metadata } from 'next'
import Link from 'next/link'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/data/categories'
import ProductCard from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'Deals & Discounts on Tech – Laptops, Phones, Accessories',
  description:
    'Hand-picked tech deals at TechNest US — discounted laptops, smartphones, headphones, luggage, webcams and accessories, verified and updated every week.',
  alternates: { canonical: '/deals' },
}

export default function DealsPage() {
  const deals = PRODUCTS.filter((p) => p.oldPrice && p.oldPrice > p.price)
  const grouped = CATEGORIES.map((category) => ({
    category,
    products: deals.filter((p) => p.categorySlug === category.slug),
  })).filter((group) => group.products.length > 0)

  return (
    <>
      <section className="deals container">
        {deals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🏷️</span>
            <h3>No active deals right now</h3>
            <p>Check back soon — new deals are added every week.</p>
          </div>
        ) : (
          <>
            <div className="deals-meta">
              <p className="deals-count">
                <strong>{deals.length}</strong> active deals
              </p>
              <p className="deals-tag">🛡️ Genuine products — prices verified every week</p>
            </div>
            {grouped.map(({ category, products }) => (
              <section key={category.slug} className="deals-group">
                <div className="deals-group-head">
                  <span className="deals-group-icon" aria-hidden="true">
                    {category.icon}
                  </span>
                  <h2>{category.name}</h2>
                  <Link href={`/shop/${category.slug}`} className="deals-group-link">
                    View all →
                  </Link>
                </div>
                <div className="product-grid deals-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}

            <section className="deals-cta">
              <div className="deals-cta-glow" aria-hidden="true" />
              <div className="deals-cta-text">
                <span className="deals-cta-badge">⚡ Limited Time</span>
                <h2>Don&apos;t miss the Flash Sale</h2>
                <p>
                  Time-limited flash discounts on top gadgets — when it&apos;s
                  gone, it&apos;s gone.
                </p>
                <CountdownTimer />
              </div>
              <Link href="/shop/flash-sale" className="btn btn-accent deals-cta-btn">
                View Flash Sale →
              </Link>
            </section>
          </>
        )}
      </section>
    </>
  )
}
