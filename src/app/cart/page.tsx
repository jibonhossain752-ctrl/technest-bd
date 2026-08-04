'use client'

import Link from 'next/link'
import { useCart } from '@/context/useCart'
import { formatBDT } from '@/data/products'
import PageHeader from '@/components/ui/PageHeader'

export default function CartPage() {
  const { items, total, updateQty, removeFromCart, clearCart } = useCart()

  return (
    <>
      <PageHeader title="Your Cart" subtitle="Review your items before checkout" />

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
                  <Link href={`/product/${product.slug}`} className="cart-row-img">
                    <span aria-hidden="true">{product.image}</span>
                  </Link>
                  <div className="cart-row-info">
                    <Link href={`/product/${product.slug}`} className="cart-row-name">
                      {product.name}
                    </Link>
                    <span className="cart-row-cat">{product.category}</span>
                    <strong>{formatBDT(product.price)}</strong>
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
                    {formatBDT(product.price * qty)}
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
                <strong>{formatBDT(total)}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <strong className="free">FREE</strong>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatBDT(total)}</strong>
              </div>
              <Link href="/checkout" className="btn btn-accent block">
                Proceed to Checkout
              </Link>
              <Link href="/shop" className="btn btn-outline block">
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
