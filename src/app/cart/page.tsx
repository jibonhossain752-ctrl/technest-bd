'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/useCart'
import { formatUSD } from '@/data/products'
import { track, pixelFor } from '@/lib/tracking'

const POPUP_PREVIEW = 5

export default function CartPage() {
  const { items, total, updateQty, removeFromCart, clearCart } = useCart()
  const [isDesktop, setIsDesktop] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [viewAll, setViewAll] = useState(false)

  useEffect(() => {
    track('cart_view', '/cart', { item_count: items.length })
  }, [items.length])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!popupOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopupOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [popupOpen])

  const previewItems = useMemo(
    () => (viewAll ? items : items.slice(0, POPUP_PREVIEW)),
    [items, viewAll],
  )

  const openPopup = () => {
    setViewAll(false)
    setPopupOpen(true)
    track('checkout_view', '/checkout-popup', { item_count: items.length })
    pixelFor('begin_checkout', { item_count: items.length })
  }

  return (
    <>
      <section className="cart-page container">
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven&apos;t added anything yet.</p>
            <Link href="/shop" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-list">
              {items.map(({ product, qty }) => (
                <div className="cart-row" key={product.id}>
                  <Link
                    href={`/product/${product.slug}`}
                    className="cart-row-img"
                    aria-label={product.name}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.altText ?? product.name}
                        loading="lazy"
                        width={72}
                        height={72}
                      />
                    ) : (
                      <span aria-hidden="true">{product.image}</span>
                    )}
                  </Link>
                  <div className="cart-row-info">
                    <Link href={`/product/${product.slug}`} className="cart-row-name">
                      {product.name}
                    </Link>
                    <span className="cart-row-cat">{product.category}</span>
                    <strong>{formatUSD(product.price)}</strong>
                  </div>
                  <div className="qty-selector">
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <strong className="cart-row-total">
                    {formatUSD(product.price == null ? null : product.price * qty)}
                  </strong>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="clear-btn" onClick={clearCart}>
                Clear Cart
              </button>
            </div>

            <aside className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatUSD(total)}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <strong className="free">FREE</strong>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatUSD(total)}</strong>
              </div>
              {isDesktop ? (
                <button
                  type="button"
                  className="btn btn-accent block checkout-popup-trigger"
                  onClick={openPopup}
                >
                  Proceed to Checkout
                </button>
              ) : (
                <Link href="/checkout" className="btn btn-accent block">
                  Proceed to Checkout
                </Link>
              )}
              <Link href="/shop" className="btn btn-outline block">
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </section>

      {isDesktop && popupOpen && (
        <div
          className="checkout-popup-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Complete your purchase on Amazon"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPopupOpen(false)
          }}
        >
          <div className="checkout-popup">
            <div className="checkout-popup-head">
              <div>
                <h3>Complete your purchase on Amazon</h3>
                <p>Every item is bought directly on Amazon with its full buyer protection.</p>
              </div>
              <button
                type="button"
                className="checkout-popup-close"
                aria-label="Close"
                onClick={() => setPopupOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="checkout-popup-list">
              {previewItems.map(({ product, qty }, idx) => (
                <div className="checkout-popup-row" key={product.id}>
                  <span className="checkout-popup-index">{idx + 1}</span>
                  <div className="checkout-popup-img">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.altText ?? product.name}
                        loading="lazy"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span aria-hidden="true">{product.image}</span>
                    )}
                  </div>
                  <div className="checkout-popup-info">
                    <strong>{product.name}</strong>
                    <small>
                      {qty} ×{' '}
                      {product.price == null
                        ? 'Price unavailable'
                        : formatUSD(product.price)}
                    </small>
                  </div>
                  {product.buyUrl ? (
                    <a
                      href={product.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="btn btn-accent checkout-popup-buy"
                      onClick={() => {
                        track('affiliate_click', undefined, {
                          product_slug: product.slug,
                          product_name: product.name.slice(0, 200),
                          location: 'checkout-popup',
                        })
                        pixelFor('affiliate_click', { product_slug: product.slug })
                      }}
                    >
                      Buy on Amazon
                    </a>
                  ) : (
                    <small className="summary-local-note">
                      Purchased through TechNest
                    </small>
                  )}
                </div>
              ))}
              {!viewAll && items.length > POPUP_PREVIEW && (
                <button
                  type="button"
                  className="btn btn-outline checkout-popup-viewall"
                  onClick={() => {
                    track('checkout_view_all_click', undefined, {
                      count: items.length,
                    })
                    setViewAll(true)
                  }}
                >
                  View All ({items.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
