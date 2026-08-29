import { POSTS } from '@/data/posts'
import BlogCard from './BlogCard'

export default function LatestBlogPosts() {
  const posts = [...POSTS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  return (
    <section className="latest-blog-posts">
      <div className="container">
        <div className="section-head">
          <h2>Gadget Reviews & Amazon Finds</h2>
          <p>Trending gadgets, best Amazon finds this week and buying guides</p>
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
