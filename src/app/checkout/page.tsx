'use client'

import Link from 'next/link'
import { useCart } from '@/context/useCart'
import { formatUSD } from '@/data/products'
import PageHeader from '@/components/ui/PageHeader'

export default function CheckoutPage() {
  const { items, total } = useCart()

  const buyableCount = items.filter((item) => item.product.buyUrl).length
  const hasUnpriced = items.some((item) => item.product.price == null)

  const handleBuyAll = () => {
    items.forEach(({ product }) => {
      if (product.buyUrl) {
        window.open(product.buyUrl, '_blank', 'noopener,noreferrer')
      }
    })
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <section className="container">
          <div className="empty-state">
            <span className="empty-emoji">🛒</span>
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
          <h3>Your Items ({items.length})</h3>
          {buyableCount > 0 && (
            <button
              type="button"
              className="btn btn-accent buy-all"
              onClick={handleBuyAll}
            >
              Buy All on Amazon ({buyableCount})
            </button>
          )}
          {items.map(({ product, qty }) => (
            <div className="summary-item" key={product.id}>
              <span className="summary-emoji">{product.image}</span>
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
                >
                  Buy on Amazon →
                </a>
              ) : (
                <small className="summary-local-note">
                  Purchased through TechNest
                </small>
              )}
            </div>
          ))}
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatUSD(total)}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong className="free">FREE on Amazon</strong>
          </div>
          {hasUnpriced && (
            <p className="summary-note">
              ℹ️ Some items show &ldquo;Price unavailable&rdquo; — the final
              price is confirmed on Amazon.
            </p>
          )}
          <ul className="summary-trust">
            <li>🔒 Secure checkout on Amazon</li>
            <li>✅ 100% genuine products</li>
            <li>🔁 Easy returns via Amazon</li>
          </ul>
          <p className="affiliate-disclosure">
            As an Amazon Associate, I earn from qualifying purchases.
          </p>
        </aside>
      </section>
    </>
  )
}
