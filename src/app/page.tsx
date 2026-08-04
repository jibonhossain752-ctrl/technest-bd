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
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'TechNest BD',
  description:
    'Shop the latest gadgets, laptops, and accessories in Bangladesh. Genuine products, fast delivery, best prices.',
}

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <BrandStrip />
      <Reveal>
        <CategoryGrid />
      </Reveal>
      <Reveal>
        <FlashSale />
      </Reveal>
      <Reveal>
        <FeaturedProducts />
      </Reveal>
      <Reveal>
        <NewArrivals />
      </Reveal>
      <Reveal>
        <WhyChooseUs />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
      <Reveal>
        <Newsletter />
      </Reveal>
    </>
  )
}
