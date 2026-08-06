'use client'

import { useMemo, useState } from 'react'
import { POSTS } from '@/data/posts'
import PageHeader from '@/components/ui/PageHeader'
import BlogCard from '@/components/BlogCard'
import NewsletterWidget from '@/components/NewsletterWidget'

const TABS = [
  { label: 'All', match: null as string | null },
  { label: 'Reviews', match: 'Roundup' },
  { label: 'Buying Guides', match: 'Buying Guide' },
  { label: 'Tips & Tricks', match: 'Tips & Tricks' },
  { label: 'Explainer', match: 'Explainer' },
]

const INITIAL_VISIBLE = 6
const LOAD_MORE = 3

export default function BlogPage() {
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(INITIAL_VISIBLE)

  const filtered = useMemo(() => {
    const active = TABS.find((t) => t.label === tab)
    let list = POSTS
    if (active?.match) {
      list = list.filter((p) => p.category === active.match)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q),
      )
    }
    return list
  }, [tab, query])

  const visiblePosts = filtered.slice(0, visible)
  const popular = useMemo(
    () =>
      [...POSTS].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  )

  return (
    <>
      <PageHeader
        title="Blog"
        subtitle="Latest gadget reviews, buying guides and deals"
        showHomeCrumb={false}
      />

      <section className="blog container">
        <div className="blog-toolbar">
          <div className="blog-tabs" role="tablist" aria-label="Filter posts">
            {TABS.map((t) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={tab === t.label}
                className={`blog-tab${tab === t.label ? ' active' : ''}`}
                onClick={() => {
                  setTab(t.label)
                  setVisible(INITIAL_VISIBLE)
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="blog-search">
            <span className="blog-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setVisible(INITIAL_VISIBLE)
              }}
              aria-label="Search posts"
            />
          </div>
        </div>

        <div className="blog-layout">
          <div className="blog-main">
            {visiblePosts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-emoji">📰</span>
                <h3>No posts found</h3>
                <p>Try a different search term or category.</p>
              </div>
            ) : (
              <div className="blog-grid">
                {visiblePosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            )}

            {visible < filtered.length && (
              <div className="blog-load-more">
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => setVisible((v) => v + LOAD_MORE)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>

          <aside className="blog-sidebar">
            <NewsletterWidget />
            <div className="popular-posts">
              <h3>Popular Posts</h3>
              {popular.slice(0, 4).map((post) => (
                <a href={`/blog/${post.slug}`} className="popular-post" key={post.slug}>
                  <span className="popular-post-thumb" aria-hidden="true">
                    {post.emoji}
                  </span>
                  <span className="popular-post-info">
                    <strong>{post.title}</strong>
                    <small>{post.readTime}</small>
                  </span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
