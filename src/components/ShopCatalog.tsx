'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/data/products'
import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/data/categories'
import ProductCard from './ProductCard'
import { useCart } from '@/context/useCart'
import Collapsible from './ui/Collapsible'
import CategoryScrollHint from './CategoryScrollHint'
import CountdownTimer from './ui/CountdownTimer'
import { useEffect } from 'react'

interface ShopCatalogProps {
  products: Product[]
  activeSlug: string
  viewTitle: string
  viewDescription: string
  hideCategoriesMobile?: boolean
  showCountdown?: boolean
}

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

const PER_PAGE = 8

export default function ShopCatalog({
  products,
  activeSlug,
  viewTitle,
  viewDescription,
  hideCategoriesMobile = false,
  showCountdown = false,
}: ShopCatalogProps) {
  const { addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('popular')
  const [page, setPage] = useState(1)

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
          return (a.price ?? Infinity) - (b.price ?? Infinity)
        case 'price-desc':
          return (b.price ?? -Infinity) - (a.price ?? -Infinity)
        case 'rating':
          return (b.rating ?? -Infinity) - (a.rating ?? -Infinity)
        default:
          return b.reviews - a.reviews
      }
    })
  }, [products, query, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pageCount)
  const currentPage = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  )

  useEffect(() => {
    setPage(1)
  }, [query, sort, products])

  const sidebarLinks = (
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
          <span className="count">{PRODUCTS.length}</span>
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
  )

  const chipStrip = (
    <nav className="shop-cat-strip" aria-label="Browse categories">
      <Link
        href="/shop"
        className={`shop-cat-chip${activeSlug === 'all' ? ' active' : ''}`}
      >
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
          className={`shop-cat-chip${activeSlug === cat.slug ? ' active' : ''}`}
        >
          <span className="cat-dot" aria-hidden="true">
            {cat.icon}
          </span>
          {cat.name}
          <span className="count">{cat.count}</span>
        </Link>
      ))}
    </nav>
  )

  return (
    <section className="shop">
      {showCountdown && (
        <div className="flash-countdown-bar">
          <div className="container flash-countdown-inner">
            <span className="flash-countdown-label">⚡ Flash Sale ends in</span>
            <CountdownTimer />
          </div>
        </div>
      )}
      <div
        className={`container shop-layout${hideCategoriesMobile ? ' shop-hide-cats-mobile' : ''}`}
      >
        <aside className="shop-sidebar">
          <h3 className="shop-sidebar-heading">Categories</h3>
          <div className="cat-panel">{sidebarLinks}</div>
        </aside>

        <div className="shop-cat-strip-wrap">
          <h3 className="shop-cat-strip-heading">Shop by Category</h3>
          <div className="shop-cat-strip-holder">
            {chipStrip}
            <CategoryScrollHint targetSelector=".shop-cat-strip" />
          </div>
        </div>

        <div className="shop-main">
          <div className="shop-toolbar">
            <div>
              <h2>{viewTitle}</h2>
              <p>{viewDescription}</p>
            </div>
            <Collapsible
              title="Filters"
              icon="🔍"
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
            <>
              <div className="product-grid shop-grid">
                {currentPage.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>

              {pageCount > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="pagination-arrow"
                    disabled={safePage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`pagination-num${i + 1 === safePage ? ' active' : ''}`}
                      onClick={() => setPage(i + 1)}
                      aria-label={`Page ${i + 1}`}
                      aria-current={i + 1 === safePage ? 'page' : undefined}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pagination-arrow"
                    disabled={safePage === pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}

          <p className="result-count">
            Showing {filtered.length} of {products.length} products
          </p>
        </div>
      </div>
    </section>
  )
}
