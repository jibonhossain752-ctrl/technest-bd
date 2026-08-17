import { POSTS } from '@/data/posts'
import BlogCard from './BlogCard'

export default function LatestBlogPosts() {
  const posts = POSTS.slice(0, 4)

  return (
    <section className="latest-blog-posts">
      <div className="container">
        <div className="section-head">
          <h2>Gadget Reviews & Amazon Finds</h2>
          <p>Trending gadgets, best Amazon finds this week and buying guides</p>
        </div>
        <div className="blog-grid home-blog-grid">
          {posts.map((post, i) => (
            <BlogCard key={post.slug} post={post} eager={i < 4} />
          ))}
        </div>
      </div>
    </section>
  )
}
