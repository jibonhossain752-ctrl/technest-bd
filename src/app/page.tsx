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
import VideoSchema from '@/components/VideoSchema'

export const metadata: Metadata = {
  title: 'Trending Gadgets & Amazon Finds',
  description:
    'Shop trending gadgets and the best Amazon finds — cool tech gadgets under $50, useful gadgets for home, viral TikTok gadgets and more.',
  alternates: { canonical: '/' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://gadgeterea.com/',
    title: 'Trending Gadgets & Amazon Finds | GadgetErea',
    description:
      'Shop trending gadgets and the best Amazon finds — cool tech gadgets under $50, useful gadgets for home and more.',
    images: [
      {
        url: '/images/blog/best-tech-gifts-under-50.jpg',
        width: 1200,
        height: 675,
        alt: 'GadgetErea - trending gadgets and the best Amazon finds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending Gadgets & Amazon Finds | GadgetErea',
    description:
      'Shop trending gadgets and the best Amazon finds — cool tech gadgets under $50, useful gadgets for home and more.',
    images: ['/images/blog/best-tech-gifts-under-50.jpg'],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: 'GadgetErea',
  url: 'https://gadgeterea.com',
  logo: 'https://gadgeterea.com/images/logo.png',
  sameAs: [
    'https://www.facebook.com/profile.php?id=61554811563391',
    'https://www.instagram.com/gadgeterea/',
    'https://www.tiktok.com/@gadgeterea',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-844-292-0061',
    contactType: 'customer service',
    email: 'support@gadgeterea.com',
    availableLanguage: ['English'],
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://gadgeterea.com/shop?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export default function HomePage() {
  return (
    <div className="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <VideoSchema />
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
