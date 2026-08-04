import type { Metadata } from 'next'
import { PRODUCTS } from '@/data/products'
import ShopCatalog from '@/components/ShopCatalog'
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'Shop All Products',
  description:
    'Browse all tech products at TechNest BD — laptops, smartphones, gaming gear, accessories and more.',
}

export default function ShopPage() {
  return (
    <Reveal>
      <ShopCatalog
        products={PRODUCTS}
        activeSlug="all"
        viewTitle="All Products"
        viewDescription="Everything we stock, in one place"
      />
    </Reveal>
  )
}
