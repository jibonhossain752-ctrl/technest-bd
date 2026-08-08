'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '@/data/products'
import { formatUSD } from '@/data/products'
import RatingStars from './RatingStars'
import { useCart } from '@/context/useCart'

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

  const discount =
    product.oldPrice && product.price != null
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0

  const handleBuyNow = () => {
    buyNow(product, 1)
    router.push('/checkout')
  }

  const buyNowLabel = product.buyUrl ? 'Buy Now ↗' : 'Buy Now'

  return (
    <article className="product-card">
      <Link
        href={product.buyUrl ?? `/product/${product.slug}`}
        className="product-img"
        aria-label={product.name}
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
          href={product.buyUrl ?? `/product/${product.slug}`}
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
