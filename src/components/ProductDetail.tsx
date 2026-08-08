'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/data/products'
import { formatUSD } from '@/data/products'
import RatingStars from './RatingStars'
import { useCart } from '@/context/useCart'

const BADGE_LABEL: Record<string, string> = {
  hot: '🔥 Hot',
  new: 'NEW',
  sale: 'SALE',
}

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart, buyNow } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)

  const handleBuyNow = () => {
    buyNow(product, qty)
    router.push('/checkout')
  }

  const buyNowButton = product.buyUrl ? (
    <a
      href={product.buyUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="btn btn-accent buy-now"
    >
      Buy Now ↗
    </a>
  ) : (
    <button
      type="button"
      className="btn btn-accent buy-now"
      onClick={handleBuyNow}
    >
      Buy Now
    </button>
  )

  return (
    <div className="buy-actions">
      <div className="qty-selector">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span>{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      {buyNowButton}
      <button
        type="button"
        className="btn btn-outline add-cart-btn"
        onClick={() => {
          for (let i = 0; i < qty; i++) addToCart(product)
        }}
      >
        Add to Cart
      </button>
    </div>
  )
}

export function ProductDetailHero({ product }: { product: Product }) {
  const discount =
    product.oldPrice && product.price != null
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0

  return (
    <div className="product-detail-hero">
      <div className="pd-image">
        <span
          className="pd-emoji"
          role="img"
          aria-label={product.altText ?? product.name}
        >
          {product.image}
        </span>
        {discount > 0 && (
          <span className="product-badge discount pd-discount">
            -{discount}%
          </span>
        )}
      </div>
      <div className="pd-info">
        <div className="pd-title-row">
          <h1>{product.name}</h1>
          {product.badge && (
            <span className={`product-badge ${product.badge}`}>
              {BADGE_LABEL[product.badge]}
            </span>
          )}
        </div>
        <RatingStars rating={product.rating} reviews={product.reviews} />
        <div className="pd-price">
          <strong>{formatUSD(product.price)}</strong>
          {product.oldPrice && (
            <span className="old">{formatUSD(product.oldPrice)}</span>
          )}
          {discount > 0 && <span className="save">Save {discount}%</span>}
        </div>
        <p className="pd-desc">{product.description}</p>
        <AddToCartButton product={product} />
        <ul className="pd-perks">
          <li>🚚 Fast delivery across the USA</li>
          <li>✅ 100% genuine with official warranty</li>
          <li>🔁 7-day easy returns</li>
        </ul>
      </div>
    </div>
  )
}
