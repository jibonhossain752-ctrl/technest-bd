import { POSTS } from '@/data/posts'
import BlogCard from './BlogCard'

export default function LatestBlogPosts() {
  const posts = [...POSTS]
    .sort((a, b) => {
      const ad = new Date(a.date).getTime()
      const bd = new Date(b.date).getTime()
      if (bd !== ad) return bd - ad
      const aL = new Date(a.lastUpdated ?? a.date).getTime()
      const bL = new Date(b.lastUpdated ?? b.date).getTime()
      return bL - aL
    })
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
