import { POSTS } from '@/data/posts'
import BlogCard from './BlogCard'

export default function LatestBlogPosts() {
  const posts = POSTS.slice(0, 4)

  return (
    <section className="latest-blog-posts">
      <div className="container">
        <div className="section-head">
          <h2>Latest Blog Posts</h2>
          <p>Reviews, buying guides and deals — fresh every week</p>
        </div>
        <div className="blog-grid home-blog-grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
