'use client'

import Link from 'next/link'
import { getPostBySlug } from '@/data/posts'
import { categoryBadgeClass } from '@/data/blogCategories'
import { track } from '@/lib/tracking'

const DEAL_SLUGS = [
  { slug: 'amazon-echo-dot-kids-review', price: '$34.08' },
]

export default function DealSpotlight() {
  const deals = DEAL_SLUGS.map((d) => ({
    ...d,
    post: getPostBySlug(d.slug),
  })).filter((d) => d.post !== undefined)

  if (deals.length === 0) return null

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
              <Link
                href={`/blog/${post!.slug}`}
                className="deal-card-thumb"
                onClick={() =>
                  track('deal_spotlight_click', `/blog/${post!.slug}`, {
                    post_slug: post!.slug,
                  })
                }
              >
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
