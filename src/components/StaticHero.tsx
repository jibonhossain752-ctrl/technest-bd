import Link from 'next/link'
import { PRODUCTS } from '@/data/products'

export default function StaticHero() {
  const product = [...PRODUCTS]
    .filter((p) => p.imageUrl)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]

  if (!product) return null

  return (
    <section className="hero-static">
      <div className="container hero-static-inner">
        <div className="hero-static-text">
          <span className="hero-static-badge">🔥 Trending This Week</span>
          <h1>
            Trending Gadgets & Amazon Finds:{' '}
            <span className="hero-static-name">{product.name}</span>
          </h1>
          <p className="hero-static-sub">{product.description}</p>
          <Link href="/blog" className="btn btn-accent hero-static-cta">
            Read the Review
          </Link>
        </div>
        <div className="hero-static-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.altText ?? product.name}
            className="hero-static-img-el"
            width={520}
            height={520}
          />
          <span className="hero-static-tag">Deal of the Week</span>
        </div>
      </div>
    </section>
  )
}
