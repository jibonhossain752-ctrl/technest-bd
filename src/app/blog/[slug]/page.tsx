import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { POSTS, getPostBySlug } from '@/data/posts'
import BlogCard from '@/components/BlogCard'
import { categoryBadgeClass } from '@/data/blogCategories'
import ShareButtons from '@/components/ShareButtons'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }
  return { title: post.title, description: post.excerpt }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface Deal {
  product: string
  emoji: string
  price: string
  href: string
}

const DEAL_POSTS: Record<string, Deal[]> = {
  'how-to-choose-the-perfect-laptop-in-2026': [
    {
      product: 'Apple MacBook Air M2',
      emoji: '💻',
      price: '$999',
      href: '/product/apple-macbook-air-m2',
    },
  ],
  'top-5-budget-smartphones-this-month': [
    {
      product: 'Xiaomi Redmi Note 13 Pro',
      emoji: '📱',
      price: '$299',
      href: '/shop/smartphones',
    },
  ],
  'buying-guide-gaming-gear-in-bangladesh': [
    {
      product: 'Mechanical Gaming Keyboard',
      emoji: '⌨️',
      price: '$89',
      href: '/shop/gaming',
    },
  ],
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)
  const deals = DEAL_POSTS[post.slug] ?? []

  return (
    <>
      <article className="blog-post container">
        <header className="blog-post-header">
          <span className={`blog-card-badge ${categoryBadgeClass(post.category)}`}>
            {post.category}
          </span>
          <h1>{post.title}</h1>
          <p className="blog-post-excerpt">{post.excerpt}</p>
          <div className="blog-meta">
            <span className="blog-meta-avatar" aria-hidden="true">
              {post.author.charAt(0)}
            </span>
            <span>{post.author}</span>
            <span aria-hidden="true">•</span>
            <span>{formatDate(post.date)}</span>
            <span aria-hidden="true">•</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div className="blog-post-emoji" aria-hidden="true">
          {post.emoji}
        </div>

        <div className="blog-post-body">
          {post.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}

          {deals.length > 0 && (
            <>
              <p className="affiliate-disclosure">
                As an Amazon Associate, I earn from qualifying purchases.
              </p>
              {deals.map((deal) => (
                <div className="deal-card-inline" key={deal.product}>
                  <span className="deal-card-inline-img" aria-hidden="true">
                    {deal.emoji}
                  </span>
                  <div className="deal-card-inline-info">
                    <strong>{deal.product}</strong>
                    <span className="deal-card-inline-price">{deal.price}</span>
                  </div>
                  <Link
                    href={deal.href}
                    className="btn btn-accent deal-card-inline-cta"
                  >
                    Check Price on Amazon
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="blog-share">
          <span className="blog-share-label">Share this post:</span>
          <ShareButtons title={post.title} slug={post.slug} />
        </div>
      </article>

      <section className="related-posts">
        <div className="container">
          <div className="section-head">
            <h2>Related Posts</h2>
          </div>
          <div className="blog-grid">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
