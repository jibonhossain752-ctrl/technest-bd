import type { Metadata } from 'next'
import StaticHero from '@/components/StaticHero'
import QuickPills from '@/components/QuickPills'
import LatestBlogPosts from '@/components/LatestBlogPosts'
import WatchAndShop from '@/components/WatchAndShop'
import FeaturedProducts from '@/components/FeaturedProducts'
import Newsletter from '@/components/Newsletter'
import WhyChooseUs from '@/components/WhyChooseUs'
import Testimonials from '@/components/Testimonials'
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'TechNest US',
  description:
    'Shop the latest gadgets, laptops, and accessories in the USA. Genuine products, fast delivery, best prices.',
}

export default function HomePage() {
  return (
    <div className="home">
      <StaticHero />
      <QuickPills />
      <Reveal className="reveal-blog-posts" delay={0.05}>
        <LatestBlogPosts />
      </Reveal>
      <Reveal className="reveal-watch-shop" delay={0.05}>
        <WatchAndShop />
      </Reveal>
      <Reveal className="reveal-featured" delay={0.05}>
        <FeaturedProducts />
      </Reveal>
      <Reveal className="reveal-newsletter" delay={0.05}>
        <Newsletter />
      </Reveal>
      <Reveal className="reveal-why" delay={0.05}>
        <WhyChooseUs />
      </Reveal>
      <Reveal className="reveal-testimonials" delay={0.1}>
        <Testimonials />
      </Reveal>
    </div>
  )
}
