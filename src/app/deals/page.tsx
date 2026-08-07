import type { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { PRODUCTS } from '@/data/products'
import ProductCard from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'Deals',
  description:
    'Browse the best discounted gadgets, laptops, smartphones and accessories — hand-picked deals updated regularly at TechNest BD.',
}

export default function DealsPage() {
  const deals = PRODUCTS.filter((p) => p.oldPrice && p.oldPrice > p.price)

  return (
    <>
      <PageHeader
        title="Deals"
        subtitle="Hand-picked gadget deals — updated weekly"
        showHomeCrumb={false}
      />

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
            <div className="product-grid deals-grid">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

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
