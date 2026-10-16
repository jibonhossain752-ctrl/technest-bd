export const revalidate = 21600

import type { Metadata } from 'next'
import DealsCatalog from '@/components/DealsCatalog'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PageIntro from '@/components/ui/PageIntro'

export const metadata: Metadata = {
  title: 'Gadget Deals Online – Daily Tech Discounts',
  description:
    'Fresh gadget deals online — trending gadget finds at the best prices, updated every week. Discounts on laptops, phones, audio, smart home and accessories.',
  alternates: { canonical: '/deals' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://www.gadgeterea.com/deals',
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
        <PageIntro
          title="Gadget Deals Online"
          description="Gadget deals online — the best Amazon finds at the lowest verified prices."
        />
      </div>
      <DealsCatalog />
    </>
  )
}
