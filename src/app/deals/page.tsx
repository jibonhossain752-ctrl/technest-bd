export const revalidate = 21600

import type { Metadata } from 'next'
import DealsCatalog from '@/components/DealsCatalog'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'Gadget Deals Online – Daily Tech Discounts',
  description:
    'Fresh gadget deals online — trending gadget finds at the best prices, updated every week. Discounts on laptops, phones, audio, smart home and accessories.',
  alternates: { canonical: '/deals' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://gadgeterea.com/deals',
    title: 'Gadget Deals Online – Daily Tech Discounts | GadgetErea',
    description:
      'Fresh gadget deals online — trending gadget finds at the best prices, updated every week.',
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
    title: 'Gadget Deals Online – Daily Tech Discounts | GadgetErea',
    description:
      'Fresh gadget deals online — trending gadget finds at the best prices, updated every week.',
    images: ['/images/blog/best-tech-gifts-under-50.webp'],
  },
}

export default function DealsPage() {
  return (
    <>
      <Breadcrumb crumbs={[{ label: 'Deals' }]} />
      <div className="category-seo-head">
        <h1>Gadget Deals Online</h1>
        <p className="category-seo-intro">
          The best Amazon finds this week at the lowest prices — hand-picked
          tech deals on laptops, phones, audio, smart home and accessories,
          verified and refreshed every week.
        </p>
        <p className="category-seo-intro">
          Every deal here is a price drop on a product already in the
          GadgetErea catalog — when a price climbs back to its usual level,
          that product leaves the list automatically.
        </p>
      </div>
      <DealsCatalog />
    </>
  )
}
