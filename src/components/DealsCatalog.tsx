'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { PRODUCTS } from '@/data/products'
import ShopCatalog from './ShopCatalog'
import { track } from '@/lib/tracking'

export default function DealsCatalog() {
  const [activeSlug, setActiveSlug] = useState('all')

  const deals = useMemo(
    () =>
      PRODUCTS.filter(
        (p) => p.price != null && p.oldPrice && p.oldPrice > p.price,
      ),
    [],
  )

  const shown = useMemo(
    () =>
      activeSlug === 'all'
        ? deals
        : deals.filter((p) => p.categorySlug === activeSlug),
    [deals, activeSlug],
  )

  if (deals.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <span className="empty-emoji">🏷️</span>
          <h3>No active deals right now</h3>
          <p>Check back soon — new deals are added every week.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={null}>
        <ShopCatalog
          products={shown}
          activeSlug={activeSlug}
          onCategorySelect={setActiveSlug}
          countProducts={deals}
        />
      </Suspense>
      <div className="container">
        <section className="deals-cta">
          <div className="deals-cta-glow" aria-hidden="true" />
          <div className="deals-cta-text">
            <span className="deals-cta-badge">⚡ Limited Time</span>
            <h2>Don&apos;t miss the Flash Sale</h2>
            <p>
              Time-limited flash discounts on top gadgets — when it&apos;s
              gone, it&apos;s gone.
            </p>
            <CountdownTimer />
          </div>
          <Link
            href="/shop/flash-sale"
            className="btn btn-accent deals-cta-btn"
            onClick={() => track('flash_sale_cta_click')}
          >
            View Flash Sale →
          </Link>
        </section>
      </div>
    </>
  )
}
