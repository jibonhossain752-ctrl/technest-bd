'use client'

import Link from 'next/link'
import type { BlogPost } from '@/data/posts'
import { categoryBadgeClass } from '@/data/blogCategories'
import { track } from '@/lib/tracking'
import { responsiveSrcset } from '@/lib/images'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface BlogCardProps {
  post: BlogPost
  trackLocation?: string
  fromSlug?: string
  eager?: boolean
}

export default function BlogCard({
  post,
  trackLocation = 'listing',
  fromSlug,
  eager = false,
}: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="blog-card"
      onClick={() =>
        track('blog_card_click', `/blog/${post.slug}`, {
          slug: post.slug,
          location: trackLocation,
          from: fromSlug,
        })
      }
    >
      <div className="blog-card-thumb">
        {post.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.heroImage}
            srcSet={responsiveSrcset(post.heroImage)}
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 260px, 45vw"
            alt={post.altText ?? `${post.title} — featured image`}
            className="blog-card-thumb-img"
            loading={eager ? 'eager' : 'lazy'}
            width={400}
            height={225}
          />
        ) : (
          <span className="blog-card-emoji" aria-hidden="true">
            {post.emoji}
          </span>
        )}
        <span className={`blog-card-badge ${categoryBadgeClass(post.category)}`}>
          {post.category}
        </span>
      </div>
      <div className="blog-card-body">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="blog-card-meta">
          <span className="blog-card-avatar" aria-hidden="true">
            {post.author.charAt(0)}
          </span>
          <span>{post.author}</span>
          <span aria-hidden="true">•</span>
          <span>{formatDate(post.date)}</span>
          <span aria-hidden="true">•</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </Link>
  )
}
