import Link from 'next/link'
import { CATEGORIES } from '@/data/categories'

export default function CategoryGrid() {
  return (
    <section className="categories">
      <div className="container">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <p>Everything you need, all in one place</p>
        </div>
        <div className="cat-grid">
          <Link href="/shop" className="cat-card cat-all">
            <span className="cat-icon" aria-hidden="true">
              ✨
            </span>
            <h3>All Products</h3>
            <p>All items</p>
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="cat-card"
            >
              <span className="cat-icon" aria-hidden="true">
                {cat.icon}
              </span>
              <h3>{cat.name}</h3>
              <p>{cat.count} products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
