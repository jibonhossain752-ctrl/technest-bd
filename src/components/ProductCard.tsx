'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '@/data/products'
import { formatUSD } from '@/data/products'
import RatingStars from './RatingStars'
import { useCart } from '@/context/useCart'
import { track, pixelFor } from '@/lib/tracking'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

const BADGE_LABEL: Record<string, string> = {
  hot: '🔥 Hot',
  new: 'NEW',
  sale: 'SALE',
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { buyNow } = useCart()
  const router = useRouter()
  const cardRef = useRef<HTMLElement>(null)
  const seen = useRef(false)

  useEffect(() => {
    const el = cardRef.current
    if (!el || seen.current) return
    let done = false
    const io = new IntersectionObserver(
      (entries) => {
        if (done) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            done = true
            seen.current = true
            track('product_impression', undefined, {
              product_slug: product.slug,
              product_name: product.name.slice(0, 200),
            })
            io.disconnect()
            return
          }
        }
      },
      { rootMargin: '100px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
    }
  }, [product.slug, product.name])

  const discount =
    product.oldPrice && product.price != null
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0

  const handleBuyNow = () => {
    buyNow(product, 1)
    router.push('/checkout')
  }

  const buyNowLabel = product.buyUrl ? 'Buy Now ↗' : 'Buy Now'

  const trackAffiliate = () => {
    track('affiliate_click', undefined, {
      product_slug: product.slug,
      product_name: product.name.slice(0, 200),
      location: 'product-card',
    })
    pixelFor('affiliate_click', { product_slug: product.slug })
  }

  return (
    <article className="product-card" ref={cardRef}>
      <Link
        href={product.cardHref ?? product.buyUrl ?? `/product/${product.slug}`}
        className="product-img"
        aria-label={product.name}
        onClick={() => {
          track('product_card_click', product.cardHref ?? product.buyUrl ?? `/product/${product.slug}`, {
            product_slug: product.slug,
          })
          if (product.buyUrl && !product.cardHref) trackAffiliate()
        }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.altText ?? product.name}
            className="product-img-el"
            loading="lazy"
            width={400}
            height={400}
          />
        ) : (
          <span
            className="product-emoji"
            role="img"
            aria-label={product.altText ?? product.name}
          >
            {product.image}
          </span>
        )}
        {product.badge && (
          <span className={`product-badge ${product.badge}`}>
            {BADGE_LABEL[product.badge]}
          </span>
        )}
        {discount > 0 && (
          <span className="product-badge discount">-{discount}%</span>
        )}
      </Link>

      <div className="product-info">
        <Link
          href={`/shop/${product.categorySlug}`}
          className="product-cat"
        >
          {product.category}
        </Link>
        <Link
          href={product.cardHref ?? product.buyUrl ?? `/product/${product.slug}`}
          className="product-name"
        >
          {product.name}
        </Link>
        <RatingStars rating={product.rating} reviews={product.reviews} />
        <div className="product-price">
          <strong>{formatUSD(product.price)}</strong>
          {product.oldPrice && (
            <span className="old">{formatUSD(product.oldPrice)}</span>
          )}
        </div>
        <div className="product-actions">
          <button
            type="button"
            className="add-cart"
            onClick={() => onAddToCart?.(product)}
          >
            Add to Cart
          </button>
          {product.buyUrl ? (
            <a
              href={product.buyUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="buy-now"
              onClick={trackAffiliate}
            >
              {buyNowLabel}
            </a>
          ) : (
            <button
              type="button"
              className="buy-now"
              onClick={handleBuyNow}
            >
              {buyNowLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
