import Link from 'next/link'
import { getProductById, NEW_ARRIVALS_IDS } from '@/data/products'
import ProductGrid from './ProductGrid'

export default function NewArrivals() {
  const newProducts = NEW_ARRIVALS_IDS.map(getProductById).filter(
    (p) => p !== undefined,
  )

  return (
    <section className="new-arrivals">
      <div className="container">
        <div className="section-head">
          <div className="section-title-row">
            <div>
              <h2>New Arrivals</h2>
              <p>Fresh off the shelf — be the first to own them</p>
            </div>
            <Link href="/shop/new-arrivals" className="view-all-link">
              View All →
            </Link>
          </div>
        </div>
        <ProductGrid products={newProducts} />
        <div className="section-more">
          <Link href="/shop/new-arrivals" className="btn btn-primary">
            View All New Arrivals
          </Link>
        </div>
      </div>
    </section>
  )
}
