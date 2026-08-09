'use client'

import { useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import type { Product } from '@/data/products'
import { CATEGORIES } from '@/data/categories'
import ProductCard from './ProductCard'
import { useCart } from '@/context/useCart'
import Collapsible from './ui/Collapsible'
import CategoryScrollHint from './CategoryScrollHint'
import CountdownTimer from './ui/CountdownTimer'
import { useEffect } from 'react'
import { track } from '@/lib/tracking'

interface ShopCatalogProps {
  products: Product[]
  activeSlug: string
  viewTitle: string
  viewDescription: string
  hideCategoriesMobile?: boolean
  showCountdown?: boolean
  onCategorySelect?: (slug: string) => void
  countProducts?: Product[]
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
  onCategorySelect,
  countProducts,
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

  const totalCount = countProducts?.length ?? products.length
  const categoryCount = (slug: string) =>
    countProducts
      ? countProducts.filter((p) => p.categorySlug === slug).length
      : CATEGORIES.find((c) => c.slug === slug)?.count ?? 0

  const handleCategory = (
    e: MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    track('category_select', undefined, { slug })
    if (!onCategorySelect) return
    e.preventDefault()
    onCategorySelect(slug)
  }

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    track('shop_pagination', undefined, { page: nextPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const trackSearch = (query: string) => {
    const q = query.trim()
    if (q) track('shop_search', undefined, { query: q.slice(0, 100) })
  }

  const sidebarLinks = (
    <ul className="sidebar-links">
      <li>
        <Link
          href="/shop"
          onClick={(e) => handleCategory(e, 'all')}
          className={activeSlug === 'all' ? 'active' : ''}
        >
          <span className="cat-dot" aria-hidden="true">
            ✦
          </span>
          All Products
          <span className="count">{totalCount}</span>
        </Link>
      </li>
      {CATEGORIES.map((cat) => (
        <li key={cat.slug}>
          <Link
            href={`/shop/${cat.slug}`}
            onClick={(e) => handleCategory(e, cat.slug)}
            className={activeSlug === cat.slug ? 'active' : ''}
          >
            <span className="cat-dot" aria-hidden="true">
              {cat.icon}
            </span>
            {cat.name}
            <span className="count">{categoryCount(cat.slug)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )

  const chipStrip = (
    <nav className="shop-cat-strip" aria-label="Browse categories">
      <Link
        href="/shop"
        onClick={(e) => handleCategory(e, 'all')}
        className={`shop-cat-chip${activeSlug === 'all' ? ' active' : ''}`}
      >
        <span className="cat-dot" aria-hidden="true">
          ✦
        </span>
        All Products
        <span className="count">{totalCount}</span>
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/shop/${cat.slug}`}
          onClick={(e) => handleCategory(e, cat.slug)}
          className={`shop-cat-chip${activeSlug === cat.slug ? ' active' : ''}`}
        >
          <span className="cat-dot" aria-hidden="true">
            {cat.icon}
          </span>
          {cat.name}
          <span className="count">{categoryCount(cat.slug)}</span>
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
              onToggle={(open) => track('shop_filters_toggle', undefined, { open })}
            >
              <div className="shop-controls">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={(e) => trackSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') trackSearch((e.target as HTMLInputElement).value)
                  }}
                  aria-label="Search products"
                />
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortKey)
                    track('shop_sort', undefined, { sort: e.target.value })
                  }}
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
                    onClick={() => goToPage(Math.max(1, safePage - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`pagination-num${i + 1 === safePage ? ' active' : ''}`}
                      onClick={() => goToPage(i + 1)}
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
                    onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}

          <p className="result-count">
            Showing {filtered.length} of {totalCount} products
          </p>
        </div>
      </div>
    </section>
  )
}
