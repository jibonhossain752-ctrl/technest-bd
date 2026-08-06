import Link from 'next/link'
import { getPostBySlug } from '@/data/posts'
import { categoryBadgeClass } from '@/data/blogCategories'

const DEALS = [
  { slug: 'how-to-choose-the-perfect-laptop-in-2026', price: '$799.99' },
  { slug: 'top-5-budget-smartphones-this-month', price: '$199.99' },
  { slug: 'buying-guide-gaming-gear-in-bangladesh', price: '$49.99' },
]

export default function DealSpotlight() {
  const deals = DEALS.map((d) => ({
    ...d,
    post: getPostBySlug(d.slug),
  })).filter((d) => d.post !== undefined)

  return (
    <section className="deal-spotlight">
      <div className="container">
        <div className="section-head">
          <h2>Deal Spotlight</h2>
          <p>Hand-picked products our reviewers love</p>
        </div>
        <div className="deal-spotlight-grid">
          {deals.map(({ post, price }) => (
            <article className="deal-card" key={post!.slug}>
              <Link href={`/blog/${post!.slug}`} className="deal-card-thumb">
                <span className="deal-card-emoji" aria-hidden="true">
                  {post!.emoji}
                </span>
                <span className={`deal-card-badge ${categoryBadgeClass(post!.category)}`}>
                  {post!.category}
                </span>
                <span className="deal-price-tag">{price}</span>
                <span className="deal-check-btn">Check Price</span>
              </Link>
              <div className="deal-card-body">
                <h3>{post!.title}</h3>
                <p>{post!.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
