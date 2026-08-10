import Link from 'next/link'
import { PRODUCTS } from '@/data/products'
import ProductGrid from './ProductGrid'

const BEST_SELLING_LIMIT = 8

export default function FeaturedProducts() {
  return (
    <section className="products" id="products">
      <div className="container">
        <div className="section-head">
          <h2>Best Amazon Finds This Week</h2>
          <p>Top-rated trending gadgets our customers love</p>
        </div>
        <ProductGrid
          products={[...PRODUCTS]
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, BEST_SELLING_LIMIT)}
        />
        <div className="view-all-wrap">
          <Link href="/shop" className="btn btn-primary view-all-products">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
