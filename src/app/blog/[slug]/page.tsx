import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { POSTS, getPostBySlug } from '@/data/posts'
import { PRODUCTS } from '@/data/products'
import BlogCard from '@/components/BlogCard'
import { categoryBadgeClass } from '@/data/blogCategories'
import ShareButtons from '@/components/ShareButtons'
import NewsletterPopup from '@/components/NewsletterPopup'
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink'
import PostFaq from '@/components/PostFaq'

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
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    keywords: [post.primaryKeyword, ...(post.secondaryKeywords ?? [])].filter(
      (k): k is string => Boolean(k),
    ),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt,
      type: 'article',
      url: `/blog/${post.slug}`,
    },
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)
  const deal = post.dealCard
  const product = deal
    ? PRODUCTS.find((p) => p.slug === deal.productSlug)
    : undefined

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

        {post.heroImage ? (
          <figure className="blog-post-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.heroImage}
              alt={post.altText ?? `${post.title} — featured image`}
              width={1200}
              height={675}
              loading="eager"
            />
          </figure>
        ) : (
          <div className="blog-post-emoji" aria-hidden="true">
            {post.emoji}
          </div>
        )}

        <div className="blog-post-body">
          {post.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}

          {deal && (
            <>
              <p className="affiliate-disclosure">
                As an Amazon Associate, I earn from qualifying purchases.
              </p>
              <div className="deal-card-inline">
                {product?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.altText ?? product.name}
                    className="deal-card-inline-img-el"
                    width={58}
                    height={58}
                  />
                ) : (
                  <span
                    className="deal-card-inline-img"
                    role="img"
                    aria-label={
                      product?.altText ?? product?.name ?? deal.productSlug
                    }
                  >
                    {product?.image ?? '🛒'}
                  </span>
                )}
                <div className="deal-card-inline-info">
                  <strong>{product?.name ?? deal.productSlug}</strong>
                </div>
                <TrackedAffiliateLink
                  href={deal.affiliateUrl}
                  className="btn btn-accent deal-card-inline-cta"
                  meta={{
                    product_slug: deal.productSlug,
                    post_slug: post.slug,
                    location: 'blog-post',
                  }}
                >
                  Check Price on Amazon
                </TrackedAffiliateLink>
              </div>
            </>
          )}

          {post.faq && post.faq.length > 0 && (
            <PostFaq faq={post.faq} postSlug={post.slug} />
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
              <BlogCard
                key={p.slug}
                post={p}
                trackLocation="related"
                fromSlug={post.slug}
              />
            ))}
          </div>
        </div>
      </section>
      <NewsletterPopup />
    </>
  )
}
