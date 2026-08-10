import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PRODUCTS } from '@/data/products'
import ShopCatalog from '@/components/ShopCatalog'
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'Shop All Products – Laptops, Phones, Audio & More',
  description:
    'Browse every product at TechNest US — laptops, smartphones, gaming gear, audio, cameras, smart home and accessories. Genuine products with official warranty and fast US delivery.',
  alternates: { canonical: '/shop' },
}

export default function ShopPage() {
  return (
    <Reveal>
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
