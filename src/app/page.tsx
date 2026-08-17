export const revalidate = 7200

import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import StaticHero from '@/components/StaticHero'
import QuickPills from '@/components/QuickPills'
import LatestBlogPosts from '@/components/LatestBlogPosts'
import Reveal from '@/components/ui/Reveal'
import VideoSchema from '@/components/VideoSchema'

const WatchAndShop = dynamic(() => import('@/components/WatchAndShop'))
const FeaturedProducts = dynamic(() => import('@/components/FeaturedProducts'))
const Newsletter = dynamic(() => import('@/components/Newsletter'))
const WhyChooseUs = dynamic(() => import('@/components/WhyChooseUs'))
const Testimonials = dynamic(() => import('@/components/Testimonials'))

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
        url: '/images/blog/best-tech-gifts-under-50.webp',
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
    images: ['/images/blog/best-tech-gifts-under-50.webp'],
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
