'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/useCart'
import { formatBDT } from '@/data/products'
import { placeOrder } from '@/lib/orders'
import PageHeader from '@/components/ui/PageHeader'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const subscribed = data.get('subscribe') === 'on'
    const name = String(data.get('name') ?? '')
    const phone = String(data.get('phone') ?? '')
    const email = String(data.get('email') ?? '')

    const order = placeOrder({ name, phone, email }, items, subscribed)
    setOrderId(order.id)
    setPlaced(true)
    clearCart()
  }

  if (placed) {
    return (
      <>
        <PageHeader title="Order Placed" />
        <section className="container">
          <div className="empty-state">
            <span className="empty-emoji">🎉</span>
            <h2>Thank you for your order!</h2>
            <p>
              Order <strong>{orderId}</strong> has been placed successfully. Our
              team will call you shortly to confirm delivery details.
            </p>
            <Link href="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </section>
      </>
    )
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
      <PageHeader title="Checkout" subtitle="Complete your purchase" />

      <section className="checkout container">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Contact Information</h3>
            <div className="form-row">
              <input type="text" name="name" placeholder="Full Name" required />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email Address (optional)"
            />
          </div>

          <div className="form-section">
            <h3>Delivery Address</h3>
            <input type="text" name="address" placeholder="Street / Area" required />
            <div className="form-row">
              <input type="text" name="city" placeholder="City" required />
              <input type="text" name="district" placeholder="District" required />
            </div>
            <textarea
              name="note"
              placeholder="Delivery note (optional)"
              rows={3}
            />
          </div>

          <div className="form-section">
            <h3>Payment Method</h3>
            <label className="radio-option">
              <input type="radio" name="payment" defaultChecked />
              <span>💵 Cash on Delivery</span>
            </label>
            <label className="radio-option">
              <input type="radio" name="payment" />
              <span>📱 bKash / Nagad</span>
            </label>
            <label className="radio-option">
              <input type="radio" name="payment" />
              <span>💳 Credit / Debit Card</span>
            </label>
          </div>

          <div className="form-section opt-in">
            <label className="checkbox-option">
              <input type="checkbox" name="subscribe" />
              <span>
                Send me updates about deals and new arrivals via SMS/Email
              </span>
            </label>
            <p className="opt-in-note">
              We&apos;ll use the phone number or email you entered above. No
              spam, unsubscribe anytime.
            </p>
          </div>

          <button type="submit" className="btn btn-accent block">
            Place Order · {formatBDT(total)}
          </button>
        </form>

        <aside className="cart-summary">
          <h3>Order Summary</h3>
          {items.map(({ product, qty }) => (
            <div className="summary-item" key={product.id}>
              <span className="summary-emoji">{product.image}</span>
              <div>
                <strong>{product.name}</strong>
                <small>
                  {qty} × {formatBDT(product.price)}
                </small>
              </div>
              <span>{formatBDT(product.price * qty)}</span>
            </div>
          ))}
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
        </aside>
      </section>
    </>
  )
}
