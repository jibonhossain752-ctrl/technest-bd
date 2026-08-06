import Link from 'next/link'
import { getProductById } from '@/data/products'

export default function StaticHero() {
  const product = getProductById('p1')

  if (!product) return null

  return (
    <section className="hero-static">
      <div className="container hero-static-inner">
        <div className="hero-static-text">
          <span className="hero-static-badge">🔥 Trending This Week</span>
          <h1>
            Trending Find of the Week:{' '}
            <span className="hero-static-name">{product.name}</span>
          </h1>
          <p className="hero-static-sub">{product.description}</p>
          <Link href="/blog" className="btn btn-accent hero-static-cta">
            Read the Review
          </Link>
        </div>
        <div className="hero-static-img" aria-hidden="true">
          <span className="hero-static-emoji">{product.image}</span>
          <span className="hero-static-tag">Deal of the Week</span>
        </div>
      </div>
    </section>
  )
}
