import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { POSTS, getPostBySlug } from '@/data/posts'
import { PRODUCTS } from '@/data/products'
import BlogCard from '@/components/BlogCard'
import { categoryBadgeClass } from '@/data/blogCategories'
import ShareButtons from '@/components/ShareButtons'
import NewsletterPopup from '@/components/NewsletterPopupLazy'
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink'
import PostFaq from '@/components/PostFaq'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

const DEFAULT_KEEP_BROWSING = [
  {
    href: '/deals',
    label: 'Gadget deals online — see this week\u2019s discounts',
  },
  {
    href: '/shop/accessories',
    label: 'Cool tech gadgets under $50 in Accessories',
  },
  {
    href: '/shop/audio-wearables',
    label: 'Trending gadgets — audio & wearables',
  },
]

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }
  const metaTitle = post.metaTitle ?? post.title
  const metaDescription = post.metaDescription ?? post.excerpt
  const heroImage = post.heroImage
    ? `https://gadgeterea.com${post.heroImage}`
    : undefined
  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [post.primaryKeyword, ...(post.secondaryKeywords ?? [])].filter(
      (k): k is string => Boolean(k),
    ),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      url: `/blog/${post.slug}`,
      siteName: 'GadgetErea',
      ...(heroImage
        ? {
            images: [
              {
                url: heroImage,
                width: 1200,
                height: 675,
                alt: post.altText ?? post.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: heroImage ? 'summary_large_image' : 'summary',
      title: metaTitle,
      description: metaDescription,
      ...(heroImage ? { images: [heroImage] } : {}),
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

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    image: post.heroImage ? `https://gadgeterea.com${post.heroImage}` : undefined,
    datePublished: post.date,
    dateModified: post.lastUpdated ?? post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GadgetErea',
      url: 'https://gadgeterea.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gadgeterea.com/gadgeterea-logo.webp',
      },
    },
    mainEntityOfPage: `https://gadgeterea.com/blog/${post.slug}`,
    ...(post.schemaRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: post.schemaRating.ratingValue,
            ratingCount: post.schemaRating.ratingCount,
            bestRating: 5,
          },
        }
      : {}),
  }

  const faqPageJsonLd =
    post.faq && post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingJsonLd),
        }}
      />
      {faqPageJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqPageJsonLd),
          }}
        />
      )}
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
            <Image
              src={post.heroImage}
              alt={post.altText ?? `${post.title} — featured image`}
              width={1200}
              height={675}
              sizes="(max-width: 768px) 100vw, 900px"
              priority
            />
          </figure>
        ) : (
          <div className="blog-post-emoji" aria-hidden="true">
            {post.emoji}
          </div>
        )}

        <div className="blog-post-body">
          {post.content.map((block, i) =>
            typeof block === 'string' ? (
              <p key={i}>{block}</p>
            ) : 'heading' in block ? (
              <h2 key={`h-${i}`} className="blog-post-h2">
                {block.heading}
              </h2>
            ) : (
              <figure key={`img-${i}`} className="blog-inline-figure">
                <Image
                  src={block.image}
                  alt={block.alt}
                  width={block.width ?? 900}
                  height={block.height ?? 675}
                  sizes="(max-width: 768px) 100vw, 700px"
                  loading="lazy"
                />
              </figure>
            ),
          )}

          {deal && (
            <>
              <p className="affiliate-disclosure">
                {post.affiliateDisclosure ??
                  'As an Amazon Associate, I earn from qualifying purchases.'}
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
                    loading="lazy"
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
                  {deal.ctaLabel ?? 'Check Price on Amazon'}
                </TrackedAffiliateLink>
              </div>
            </>
          )}

          {post.faq && post.faq.length > 0 && (
            <PostFaq faq={post.faq} postSlug={post.slug} />
          )}

          <nav className="blog-post-links" aria-label="Related shopping links">
            <h2>Keep Browsing</h2>
            <ul>
              {(post.keepBrowsing ?? DEFAULT_KEEP_BROWSING).map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
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
