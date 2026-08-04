import { PRODUCTS } from '@/data/products'
import ProductGrid from './ProductGrid'

export default function FeaturedProducts() {
  return (
    <section className="products" id="products">
      <div className="container">
        <div className="section-head">
          <h2>Featured Products</h2>
          <p>Best-sellers our customers love</p>
        </div>
        <ProductGrid products={PRODUCTS} />
      </div>
    </section>
  )
}
