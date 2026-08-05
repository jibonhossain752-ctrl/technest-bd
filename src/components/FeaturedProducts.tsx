import Link from 'next/link'
import { PRODUCTS } from '@/data/products'
import BestSellingCard from './BestSellingCard'

const BEST_SELLING_LIMIT = 12

export default function FeaturedProducts() {
  return (
    <section className="products" id="products">
      <div className="container">
        <div className="section-head">
          <h2>Best Selling Products</h2>
          <p>Best-sellers our customers love</p>
        </div>
        <div className="bs-grid">
          {PRODUCTS.slice(0, BEST_SELLING_LIMIT).map((product) => (
            <BestSellingCard key={product.id} product={product} />
          ))}
        </div>
        <div className="view-all-wrap">
          <Link href="/shop" className="btn btn-primary view-all-products">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
