import Link from 'next/link'
import { CATEGORIES } from '@/data/categories'
import { PRODUCTS } from '@/data/products'

export default function HomeCategoryStrip() {
  return (
    <section className="home-cats">
      <div className="container">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <p>Find exactly what you&apos;re looking for</p>
        </div>
        <nav className="shop-cat-strip home-cat-strip" aria-label="Browse categories">
          <Link href="/shop" className="shop-cat-chip">
            <span className="cat-dot" aria-hidden="true">
              ✦
            </span>
            All Products
            <span className="count">{PRODUCTS.length}</span>
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="shop-cat-chip"
            >
              <span className="cat-dot" aria-hidden="true">
                {cat.icon}
              </span>
              {cat.name}
              <span className="count">{cat.count}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
