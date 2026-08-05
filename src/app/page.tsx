import type { Metadata } from 'next'
import HeroCarousel from '@/components/HeroCarousel'
import BrandStrip from '@/components/BrandStrip'
import CategoryGrid from '@/components/CategoryGrid'
import FlashSale from '@/components/FlashSale'
import FeaturedProducts from '@/components/FeaturedProducts'
import NewArrivals from '@/components/NewArrivals'
import WhyChooseUs from '@/components/WhyChooseUs'
import Testimonials from '@/components/Testimonials'
import Newsletter from '@/components/Newsletter'
import SocialRow from '@/components/SocialRow'
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'TechNest BD',
  description:
    'Shop the latest gadgets, laptops, and accessories in Bangladesh. Genuine products, fast delivery, best prices.',
}

export default function HomePage() {
  return (
    <div className="home">
      <HeroCarousel />
      <BrandStrip />
      <Reveal className="reveal-categories" delay={0.05}>
        <CategoryGrid />
      </Reveal>
      <Reveal className="reveal-flash" delay={0.1}>
        <FlashSale />
      </Reveal>
      <Reveal className="reveal-new-arrivals" delay={0.1}>
        <NewArrivals />
      </Reveal>
      <Reveal className="reveal-featured" delay={0.05}>
        <FeaturedProducts />
      </Reveal>
      <Reveal className="reveal-why" delay={0.05}>
        <WhyChooseUs />
      </Reveal>
      <Reveal className="reveal-testimonials" delay={0.1}>
        <Testimonials />
      </Reveal>
      <Reveal className="reveal-newsletter" delay={0.05}>
        <Newsletter />
      </Reveal>
      <SocialRow />
    </div>
  )
}
