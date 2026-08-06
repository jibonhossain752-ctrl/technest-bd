import Link from 'next/link'
import type { BlogPost } from '@/data/posts'
import { categoryBadgeClass } from '@/data/blogCategories'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card-thumb">
        <span className="blog-card-emoji" aria-hidden="true">
          {post.emoji}
        </span>
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
