import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PRODUCTS } from '@/data/products'
import ShopCatalog from '@/components/ShopCatalog'
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'Shop Gadget Deals Online – Laptops, Phones & More',
  description:
    'Gadget deals online at GadgetErea — laptops, smartphones, cool tech gadgets under $50, useful home gadgets and more, with fast US delivery.',
  alternates: { canonical: '/shop' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://gadgeterea.com/shop',
    title: 'Shop Gadget Deals Online – Laptops, Phones & More | GadgetErea',
    description:
      'Gadget deals online at GadgetErea — laptops, smartphones, cool tech gadgets under $50, useful home gadgets and more.',
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
    title: 'Shop Gadget Deals Online – Laptops, Phones & More | GadgetErea',
    description:
      'Gadget deals online at GadgetErea — laptops, smartphones, cool tech gadgets under $50, useful home gadgets and more.',
    images: ['/images/blog/best-tech-gifts-under-50.jpg'],
  },
}

export default function ShopPage() {
  return (
    <Reveal>
      <div className="category-seo-head">
        <h1>Shop Gadget Deals Online</h1>
        <p className="category-seo-intro">
          Every trending gadget and Amazon find in one place — laptops,
          smartphones, audio, gaming gear, smart home, cameras and accessories,
          with deals updated weekly.
        </p>
      </div>
      <Suspense fallback={null}>
        <ShopCatalog
          products={PRODUCTS}
          activeSlug="all"
          viewTitle="All Products"
          viewDescription="Everything we stock, in one place"
        />
      </Suspense>
    </Reveal>
  )
}
