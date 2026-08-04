import Link from 'next/link'
import { CATEGORIES } from '@/data/categories'
import { PRODUCTS } from '@/data/products'
import CategoryChips from './CategoryChips'

export default function CategoryGrid() {
  return (
    <section className="categories">
      <div className="container">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <p>Everything you need, all in one place</p>
        </div>
        <CategoryChips />
        <div className="cat-panel">
          <h3 className="cat-panel-title">📁 Categories</h3>
          <ul className="sidebar-links">
            <li>
              <Link href="/shop" className="active">
                <span className="cat-dot" aria-hidden="true">
                  ✨
                </span>
                All Products
                <span className="count">{PRODUCTS.length}</span>
              </Link>
            </li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/shop/${cat.slug}`}>
                  <span className="cat-dot" aria-hidden="true">
                    {cat.icon}
                  </span>
                  {cat.name}
                  <span className="count">{cat.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
