import type { Metadata } from 'next'
import PageHeader from '@/components/ui/PageHeader'
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
        subtitle="Hand-picked discounts on genuine gadgets — updated weekly"
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
              <p className="deals-tag">
                Want time-limited flash discounts?{' '}
                <a href="/shop/flash-sale">View Flash Sale →</a>
              </p>
            </div>
            <div className="product-grid deals-grid">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
