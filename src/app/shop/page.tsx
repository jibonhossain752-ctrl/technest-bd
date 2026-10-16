export const revalidate = 21600

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PRODUCTS } from '@/data/products'
import ShopCatalog from '@/components/ShopCatalog'
import Reveal from '@/components/ui/Reveal'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PageIntro from '@/components/ui/PageIntro'

export const metadata: Metadata = {
  title: 'Shop Gadget Deals Online – Laptops, Phones & More',
  description:
    'Gadget deals online at GadgetErea — laptops, smartphones, cool tech gadgets under $50, useful home gadgets and more, with fast US delivery.',
  alternates: { canonical: '/shop' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://www.gadgeterea.com/shop',
    title: 'Shop Gadget Deals Online – Laptops, Phones & More | GadgetErea',
    description:
      'Gadget deals online at GadgetErea — laptops, smartphones, cool tech gadgets under $50, useful home gadgets and more.',
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
    title: 'Shop Gadget Deals Online – Laptops, Phones & More | GadgetErea',
    description:
      'Gadget deals online at GadgetErea — laptops, smartphones, cool tech gadgets under $50, useful home gadgets and more.',
    images: ['/images/blog/best-tech-gifts-under-50.webp'],
  },
}

export default function ShopPage() {
  return (
    <Reveal>
      <Breadcrumb crumbs={[{ label: 'Shop' }]} />
      <div className="category-seo-head">
        <PageIntro
          title="Shop Gadget Deals Online"
          description="Every trending gadget and Amazon find in one place — laptops, phones, audio and gaming gear."
        />
      </div>
      <Suspense fallback={null}>
        <ShopCatalog
          products={PRODUCTS}
          activeSlug="all"
        />
      </Suspense>
    </Reveal>
  )
}
