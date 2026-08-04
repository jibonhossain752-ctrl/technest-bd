'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/data/products'
import { CATEGORIES } from '@/data/categories'
import ProductCard from './ProductCard'
import { useCart } from '@/context/useCart'
import Collapsible from './ui/Collapsible'

interface ShopCatalogProps {
  products: Product[]
  activeSlug: string
  viewTitle: string
  viewDescription: string
}

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export default function ShopCatalog({
  products,
  activeSlug,
  viewTitle,
  viewDescription,
}: ShopCatalogProps) {
  const { addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('popular')

  const filtered = useMemo(() => {
    let list = products
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        default:
          return b.reviews - a.reviews
      }
    })
  }, [products, query, sort])

  return (
    <section className="shop">
      <div className="container shop-layout">
        <aside className="shop-sidebar">
          <Collapsible title="Categories" icon="🗂️" defaultOpen>
            <ul className="sidebar-links">
              <li>
                <Link
                  href="/shop"
                  className={activeSlug === 'all' ? 'active' : ''}
                >
                  <span className="cat-dot" aria-hidden="true">
                    ✦
                  </span>
                  All Products
                </Link>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className={activeSlug === cat.slug ? 'active' : ''}
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
          </Collapsible>
        </aside>

        <div className="shop-main">
          <div className="shop-toolbar">
            <div>
              <h2>{viewTitle}</h2>
              <p>{viewDescription}</p>
            </div>
            <Collapsible
              title="Filters"
              icon="🔍"
              defaultOpen
              className="filters-collapsible"
            >
              <div className="shop-controls">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search products"
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </Collapsible>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-emoji">🔍</span>
              <h3>No products found</h3>
              <p>Try a different search term or browse another category.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}

          <p className="result-count">
            Showing {filtered.length} of {products.length} products
          </p>
        </div>
      </div>
    </section>
  )
}
