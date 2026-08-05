'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/data/categories'
import { PRODUCTS, formatBDT } from '@/data/products'
import CategoryChips from './CategoryChips'

export default function CategoryGrid() {
  const [active, setActive] = useState('all')

  const activeCat =
    active === 'all' ? null : CATEGORIES.find((c) => c.slug === active)

  const previewProducts = (active === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.categorySlug === active)
  ).slice(0, 6)

  const previewTitle = activeCat ? activeCat.name : 'All Products'
  const previewHref = active === 'all' ? '/shop' : `/shop/${active}`

  return (
    <section className="categories">
      <div className="container">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <p>Everything you need, all in one place</p>
        </div>

        <div className="categories-layout">
          <div className="cat-panel">
            <ul className="sidebar-links">
              <li>
                <Link
                  href="/shop"
                  className={active === 'all' ? 'active' : ''}
                  onMouseEnter={() => setActive('all')}
                  onFocus={() => setActive('all')}
                >
                  <span className="cat-dot" aria-hidden="true">
                    ✨
                  </span>
                  All Products
                  <span className="count">{PRODUCTS.length}</span>
                </Link>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className={active === cat.slug ? 'active' : ''}
                    onMouseEnter={() => setActive(cat.slug)}
                    onFocus={() => setActive(cat.slug)}
                  >
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

          <div className="cat-preview">
            <div className="cat-preview-head">
              <h3>{previewTitle}</h3>
              <Link href={previewHref} className="cat-preview-link">
                View all
              </Link>
            </div>
            <div className="cat-preview-grid">
              {previewProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="cat-preview-item"
                >
                  <span className="cat-preview-icon" aria-hidden="true">
                    {p.image}
                  </span>
                  <span className="cat-preview-name">{p.name}</span>
                  <strong className="cat-preview-price">
                    {formatBDT(p.price)}
                  </strong>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <CategoryChips />
      </div>
    </section>
  )
}
