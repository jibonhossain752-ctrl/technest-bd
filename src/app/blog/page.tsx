'use client'

import { useMemo, useState } from 'react'
import { POSTS } from '@/data/posts'
import BlogCard from '@/components/BlogCard'
import NewsletterWidget from '@/components/NewsletterWidget'
import NewsletterPopup from '@/components/NewsletterPopup'
import CategoryScrollHint from '@/components/CategoryScrollHint'
import { track } from '@/lib/tracking'

const TABS = [
  { label: 'All', match: null as string | null },
  { label: 'Reviews', match: 'Roundup' },
  { label: 'Buying Guides', match: 'Buying Guide' },
  { label: 'Tips & Tricks', match: 'Tips & Tricks' },
  { label: 'Explainer', match: 'Explainer' },
]

const INITIAL_VISIBLE = POSTS.length
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
      <section className="blog container">
        <div className="blog-toolbar">
          <div className="blog-tabs-wrap">
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
                    track('blog_tab_click', undefined, { tab: t.label })
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <CategoryScrollHint targetSelector=".blog-tabs" />
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
              onBlur={(e) => {
                const q = e.target.value.trim()
                if (q) track('blog_search', undefined, { query: q.slice(0, 100) })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value.trim()
                  if (q) track('blog_search', undefined, { query: q.slice(0, 100) })
                }
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
                  onClick={() => {
                    setVisible((v) => v + LOAD_MORE)
                    track('blog_load_more')
                  }}
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
                <a
                  href={`/blog/${post.slug}`}
                  className="popular-post"
                  key={post.slug}
                  onClick={() =>
                    track('blog_popular_post_click', `/blog/${post.slug}`, {
                      slug: post.slug,
                    })
                  }
                >
                  <span className="popular-post-thumb" aria-hidden="true">
                    {post.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.heroImage} alt="" width={46} height={46} loading="lazy" />
                    ) : (
                      post.emoji
                    )}
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
      <NewsletterPopup />
    </>
  )
}
