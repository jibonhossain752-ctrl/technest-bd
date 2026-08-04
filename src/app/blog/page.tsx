import type { Metadata } from 'next'
import Link from 'next/link'
import { POSTS } from '@/data/posts'
import PageHeader from '@/components/ui/PageHeader'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Buying guides, tech tips and explainers from the TechNest BD team.',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BlogPage() {
  const [featured, ...rest] = POSTS

  return (
    <>
      <PageHeader title="TechNest Blog" subtitle="Guides, tips and tech news" />

      <section className="blog container">
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="blog-featured">
            <div className="blog-featured-emoji">{featured.emoji}</div>
            <div className="blog-featured-body">
              <span className="blog-cat">{featured.category}</span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="blog-meta">
                <span>{featured.author}</span>
                <span>•</span>
                <span>{formatDate(featured.date)}</span>
                <span>•</span>
                <span>{featured.readTime}</span>
              </div>
            </div>
          </Link>
        )}

        <div className="blog-grid">
          {rest.map((post) => (
            <Link href={`/blog/${post.slug}`} className="blog-card" key={post.slug}>
              <div className="blog-card-emoji">{post.emoji}</div>
              <div className="blog-card-body">
                <span className="blog-cat">{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-meta">
                  <span>{formatDate(post.date)}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
