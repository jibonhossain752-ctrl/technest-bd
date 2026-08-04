import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { POSTS, getPostBySlug } from '@/data/posts'
import PageHeader from '@/components/ui/PageHeader'

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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)

  return (
    <>
      <PageHeader
        title=""
        crumbs={[{ label: 'Blog', href: '/blog' }, { label: post.title }]}
      />

      <article className="blog-post container">
        <header className="blog-post-header">
          <span className="blog-cat">{post.category}</span>
          <h1>{post.title}</h1>
          <p className="blog-post-excerpt">{post.excerpt}</p>
          <div className="blog-meta">
            <span>✍️ {post.author}</span>
            <span>📅 {formatDate(post.date)}</span>
            <span>⏱ {post.readTime}</span>
          </div>
        </header>

        <div className="blog-post-emoji" aria-hidden="true">
          {post.emoji}
        </div>

        <div className="blog-post-body">
          {post.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="blog-share">
          <Link href="/blog" className="btn btn-outline">
            ← Back to Blog
          </Link>
        </div>
      </article>

      <section className="related-posts">
        <div className="container">
          <div className="section-head">
            <h2>More From the Blog</h2>
          </div>
          <div className="blog-grid">
            {related.map((p) => (
              <Link href={`/blog/${p.slug}`} className="blog-card" key={p.slug}>
                <div className="blog-card-emoji">{p.emoji}</div>
                <div className="blog-card-body">
                  <span className="blog-cat">{p.category}</span>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
