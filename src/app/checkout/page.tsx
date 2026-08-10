'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/useCart'
import { formatUSD } from '@/data/products'
import PageHeader from '@/components/ui/PageHeader'
import { track, pixelFor } from '@/lib/tracking'

const VISIBLE_ITEMS = 3

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function CheckoutPage() {
  const { items, total } = useCart()

  const hasUnpriced = items.some((item) => item.product.price == null)
  const [seeAllOpen, setSeeAllOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    track('checkout_view', '/checkout', { item_count: items.length })
  }, [items.length])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const overflow = isDesktop && items.length > VISIBLE_ITEMS
  const visibleItems = overflow ? items.slice(0, VISIBLE_ITEMS) : items

  useEffect(() => {
    if (!seeAllOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSeeAllOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [seeAllOpen])

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <section className="container">
          <div className="empty-state">
            <span className="empty-emoji">{'🛒'}</span>
            <h2>Your cart is empty</h2>
            <p>Add some products before checking out.</p>
            <Link href="/shop" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="checkout-head container">
        <span className="checkout-eyebrow">Final step</span>
        <h1>Complete your purchase on Amazon</h1>
        <p>
          Every item is bought directly on Amazon — the safest, fastest way.
          Review your cart below, tap &ldquo;Buy on Amazon&rdquo; for each item,
          and Amazon handles payment, delivery, returns and support.
        </p>
      </section>

      <section className="checkout container">
        <div className="checkout-main">
          <div className="checkout-steps">
            <div className="checkout-step">
              <span>1</span>
              <p>
                <strong>Review your items</strong>
                <small>Check the product, price and quantity below.</small>
              </p>
            </div>
            <div className="checkout-step">
              <span>2</span>
              <p>
                <strong>Click &ldquo;Buy on Amazon&rdquo;</strong>
                <small>
                  Each button opens that exact product on Amazon in a new tab.
                </small>
              </p>
            </div>
            <div className="checkout-step">
              <span>3</span>
              <p>
                <strong>Finish securely on Amazon</strong>
                <small>
                  Amazon processes payment and ships straight to your door.
                </small>
              </p>
            </div>
          </div>

          <p className="checkout-local-note">
            No payment details are collected on this site. Your order is placed
            entirely on Amazon with its full buyer protection.
          </p>
        </div>

        <aside className="cart-summary">
          <h3>
            Your Items
            <span className="cart-summary-count">({items.length})</span>
          </h3>
          <div className="cart-summary-items">
            {visibleItems.map(({ product, qty }) => (
              <div className="summary-item" key={product.id}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.altText ?? product.name}
                    className="summary-item-img"
                    loading="lazy"
                    width={36}
                    height={36}
                  />
                ) : (
                  <span className="summary-emoji">{product.image}</span>
                )}
                <div className="summary-item-info">
                  <strong>{product.name}</strong>
                  <small>
                    {qty} × {formatUSD(product.price)}
                  </small>
                </div>
                {product.buyUrl ? (
                  <a
                    href={product.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="btn btn-accent summary-buy-link"
                    onClick={() => {
                      track('affiliate_click', undefined, {
                        product_slug: product.slug,
                        product_name: product.name.slice(0, 200),
                        location: 'checkout',
                      })
                      pixelFor('affiliate_click', { product_slug: product.slug })
                    }}
                  >
                    Buy on Amazon
                  </a>
                ) : (
                  <small className="summary-local-note">
                    Purchased through GadgetErea
                  </small>
                )}
              </div>
            ))}
          </div>
          {overflow && (
            <button
              type="button"
              className="btn btn-outline see-all-btn"
              onClick={() => {
                track('checkout_see_all_click', undefined, { count: items.length })
                setSeeAllOpen(true)
              }}
            >
              See All Products ({items.length})
            </button>
          )}
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatUSD(total)}</strong>
          </div>
          {hasUnpriced && (
            <p className="summary-note">
              Note: some items show &ldquo;Price unavailable&rdquo; — the final
              price is confirmed on Amazon.
            </p>
          )}
          <ul className="summary-trust">
            <li>
              <CheckIcon />
              Secure checkout on Amazon
            </li>
            <li>
              <CheckIcon />
              100% genuine products
            </li>
            <li>
              <CheckIcon />
              Easy returns via Amazon
            </li>
          </ul>
          <p className="affiliate-disclosure">
            As an Amazon Associate, I earn from qualifying purchases.
          </p>
        </aside>
      </section>

      {seeAllOpen && (
        <div
          className="see-all-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="All cart products"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSeeAllOpen(false)
          }}
        >
          <div className="see-all-modal">
            <div className="see-all-modal-head">
              <h3>All Products ({items.length})</h3>
              <button
                type="button"
                className="see-all-close"
                aria-label="Close"
                onClick={() => setSeeAllOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="see-all-list">
              {items.map(({ product, qty }) => (
                <div className="summary-item" key={'modal-' + product.id}>
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.altText ?? product.name}
                      className="summary-item-img"
                      loading="lazy"
                      width={36}
                      height={36}
                    />
                  ) : (
                    <span className="summary-emoji">{product.image}</span>
                  )}
                  <div className="summary-item-info">
                    <strong>{product.name}</strong>
                    <small>
                      {qty} ×{' '}
                      {product.price == null ? 'Price unavailable' : formatUSD(product.price)}
                    </small>
                  </div>
                  {product.buyUrl ? (
                    <a
                      href={product.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="btn btn-accent summary-buy-link"
                      onClick={() => {
                        track('affiliate_click', undefined, {
                          product_slug: product.slug,
                          product_name: product.name.slice(0, 200),
                          location: 'checkout-modal',
                        })
                        pixelFor('affiliate_click', { product_slug: product.slug })
                      }}
                    >
                      Buy on Amazon
                    </a>
                  ) : (
                    <small className="summary-local-note">
                      Purchased through GadgetErea
                    </small>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
