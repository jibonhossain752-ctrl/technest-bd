import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Product } from '@/data/products'
import { PRODUCTS, SHOP_VIEWS, getShopViewBySlug } from '@/data/products'
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from '@/data/categories'
import ShopCatalog from '@/components/ShopCatalog'
import Reveal from '@/components/ui/Reveal'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  const categorySlugs = CATEGORIES.map((c) => c.slug)
  const viewSlugs = SHOP_VIEWS.map((v) => v.slug)
  return [...categorySlugs, ...viewSlugs].map((category) => ({ category }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params
  const view = getShopViewBySlug(category)
  const cat = getCategoryBySlug(category)
  const title = view?.name ?? cat?.name ?? category
  const description =
    view?.description ?? cat?.description ?? `Shop ${category} at TechNest US.`
  return { title, description, alternates: { canonical: `/shop/${category}` } }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params

  const view = getShopViewBySlug(category)
  const cat = getCategoryBySlug(category)

  let products: Product[] = []
  let title = category
  let description = ''

  if (view) {
    title = view.name
    description = view.description
    products =
      view.slug === 'featured'
        ? PRODUCTS
        : view.slug === 'flash-sale'
          ? PRODUCTS.filter((p) => p.isFlashSale)
          : PRODUCTS.filter((p) => p.isNew)
  } else if (cat) {
    title = cat.name
    description = cat.description
    products = getProductsByCategory(cat.slug)
  } else {
    notFound()
  }

  return (
    <Reveal>
      <ShopCatalog
        products={products}
        activeSlug={category}
        viewTitle={title}
        viewDescription={description}
        hideCategoriesMobile={
          view ? ['new-arrivals', 'flash-sale'].includes(view.slug) : false
        }
        showCountdown={view?.slug === 'flash-sale'}
      />
    </Reveal>
  )
}
