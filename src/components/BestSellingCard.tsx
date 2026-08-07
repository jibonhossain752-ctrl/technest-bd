import Link from 'next/link'
import type { Product } from '@/data/products'
import { formatUSD } from '@/data/products'
import RatingStars from './RatingStars'

interface BestSellingCardProps {
  product: Product
}

const BADGE_LABEL: Record<string, string> = {
  hot: '🔥 Hot',
  new: 'NEW',
  sale: 'SALE',
}

export default function BestSellingCard({ product }: BestSellingCardProps) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  return (
    <article className="bs-card">
      <Link href={`/product/${product.slug}`} className="bs-card-img">
        <span className="bs-card-emoji" aria-hidden="true">
          {product.image}
        </span>
        {discount > 0 && (
          <span className="bs-card-badge discount">-{discount}%</span>
        )}
        {product.badge && (
          <span className={`bs-card-badge ${product.badge}`}>
            {BADGE_LABEL[product.badge]}
          </span>
        )}
      </Link>
      <div className="bs-card-info">
        <Link href={`/product/${product.slug}`} className="bs-card-name">
          {product.name}
        </Link>
        <RatingStars rating={product.rating} reviews={product.reviews} />
        <div className="bs-card-price">
          <strong>{formatUSD(product.price)}</strong>
          {product.oldPrice && (
            <span className="old">{formatUSD(product.oldPrice)}</span>
          )}
        </div>
      </div>
    </article>
  )
}
