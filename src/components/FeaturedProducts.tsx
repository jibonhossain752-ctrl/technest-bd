import Link from 'next/link'
import { PRODUCTS } from '@/data/products'
import ProductGrid from './ProductGrid'

export default function FeaturedProducts() {
  return (
    <section className="products" id="products">
      <div className="container">
        <div className="section-head">
          <h2>
            <span className="title-desktop">Featured Products</span>
            <span className="title-mobile">Best Selling Products</span>
          </h2>
          <p>Best-sellers our customers love</p>
        </div>
        <ProductGrid products={PRODUCTS} />
        <div className="view-all-wrap">
          <Link href="/shop" className="btn btn-primary view-all-products">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
