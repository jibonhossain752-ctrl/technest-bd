import type { Metadata } from 'next'
import DealsCatalog from '@/components/DealsCatalog'

export const metadata: Metadata = {
  title: 'Deals & Discounts on Tech – Laptops, Phones, Accessories',
  description:
    'Hand-picked tech deals at GadgetErea — discounted laptops, smartphones, headphones, luggage, webcams and accessories, verified and updated every week.',
  alternates: { canonical: '/deals' },
}

export default function DealsPage() {
  return <DealsCatalog />
}
