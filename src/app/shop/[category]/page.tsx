export const revalidate = 21600

// Only the category and shop-view slugs below are real pages: anything else is
// a 404, not a 200 that happens to render the not-found view.
export const dynamicParams = false

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Product } from '@/data/products'
import { SHOP_VIEWS, getShopViewBySlug, getShopViewProducts } from '@/data/products'
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from '@/data/categories'
import ShopCatalog from '@/components/ShopCatalog'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PageIntro from '@/components/ui/PageIntro'
import Reveal from '@/components/ui/Reveal'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

interface SeoMeta {
  title: string
  description: string
  /** Short visible description under the H1 — one sentence, 1–2 lines. */
  intro: string
}

const SEO_META: Record<string, SeoMeta> = {
  laptops: {
    title: 'Trending Gadgets – Laptops & PCs',
    description:
      'Trending laptops and PCs at GadgetErea — powerful machines for work and play. Shop genuine laptops with official warranty and fast US delivery.',
    intro: 'Trending laptops and PCs for work, study and gaming.',
  },
  smartphones: {
    title: 'Trending Gadgets & Amazon Finds – Smartphones',
    description:
      'Amazon finds gadgets shoppers love — start with smartphones. Shop trending unlocked phones and bundles at GadgetErea with warranty and fast US delivery.',
    intro: 'Unlocked smartphones and bundle deals with warranty.',
  },
  'audio-wearables': {
    title: 'Trending Gadgets – Audio & Wearables',
    description:
      'Trending gadgets for your ears — noise-canceling headphones, open-ear earbuds and wearable audio at GadgetErea. Genuine picks, official warranty, fast delivery.',
    intro:
      'Noise-canceling headphones and open-ear earbuds for daily listening.',
  },
  gaming: {
    title: 'Cool Tech Gadgets Under $50 – Gaming Gear',
    description:
      'Cool tech gadgets under $50 for gamers — keyboards, controllers and console upgrades at GadgetErea. Genuine gaming gear with official warranty and fast delivery.',
    intro: 'Cool tech gadgets under $50 that change how you play.',
  },
  accessories: {
    title: 'Cool Tech Gadgets Under $50 – Accessories',
    description:
      'Cool tech gadgets under $50 — USB-C hubs, chargers, power banks and desk accessories at GadgetErea. Genuine, warranty-backed.',
    intro: 'Cool tech gadgets under $50 — hubs and chargers.',
  },
  cameras: {
    title: 'Amazon Finds Gadgets – Cameras & Webcams',
    description:
      'Amazon finds gadgets for creators — 4K webcams, vlogging cameras and AI-tracking camcorders at GadgetErea. Genuine cameras with official warranty and fast delivery.',
    intro: '4K webcams and AI-tracking models.',
  },
  'smart-home': {
    title: 'Useful Gadgets for Home – Smart Home',
    description:
      'Useful gadgets for home — smart speakers, lighting and home tech at GadgetErea. Genuine smart home devices with official warranty and fast US delivery.',
    intro: 'Useful gadgets for home — speakers and lighting.',
  },
  featured: {
    title: 'Trending Gadgets – Featured Picks',
    description:
      'Our featured trending gadgets — hand-picked best-sellers, cool tech gadgets under $50 and Amazon finds at GadgetErea. Genuine products, fast US delivery.',
    intro: 'Trending gadgets picked by our team.',
  },
  'flash-sale': {
    title: 'Gadget Deals Online – Flash Sale',
    description:
      'Gadget deals online with the deepest discounts — flash sale prices on trending gadgets at GadgetErea. Time-limited, verified and updated weekly.',
    intro: 'Gadget deals online, verified weekly.',
  },
  'new-arrivals': {
    title: 'Trending Gadgets – New Arrivals',
    description:
      'New trending gadgets just landed — the latest phones, headphones and smart home tech at GadgetErea. Be first with genuine products and fast US delivery.',
    intro: 'New trending gadgets, from foldables to webcams.',
  },
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
  const seo = SEO_META[category]
  const view = getShopViewBySlug(category)
  const cat = getCategoryBySlug(category)
  const title = seo?.title ?? view?.name ?? cat?.name ?? category
  const description =
    seo?.description ??
    view?.description ??
    cat?.description ??
    `Shop ${category} at GadgetErea.`
  return {
    title,
    description,
    alternates: { canonical: `/shop/${category}` },
    openGraph: {
      siteName: 'GadgetErea',
      type: 'website',
      url: `https://www.gadgeterea.com/shop/${category}`,
      title: `${title} | GadgetErea`,
      description,
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
      title: `${title} | GadgetErea`,
      description,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params

  const seo = SEO_META[category]
  const view = getShopViewBySlug(category)
  const cat = getCategoryBySlug(category)

  let products: Product[] = []
  let title = category

  if (view) {
    title = view.name
    products = getShopViewProducts(view.slug)
  } else if (cat) {
    title = cat.name
    products = getProductsByCategory(cat.slug)
  } else {
    notFound()
  }

  const crumbLabel = view?.name ?? cat?.name ?? category

  return (
    <>
      <Reveal>
        {seo?.intro && (
          <div className="container">
            <div className="category-seo-head">
              <Breadcrumb
                crumbs={[
                  { label: 'Shop', href: '/shop' },
                  { label: crumbLabel },
                ]}
              />
              <PageIntro title={title} description={seo.intro} />
            </div>
          </div>
        )}
        <Suspense fallback={null}>
          <ShopCatalog
            products={products}
            activeSlug={category}
            hideCategoriesMobile={
              view ? ['new-arrivals', 'flash-sale'].includes(view.slug) : false
            }
            showCountdown={view?.slug === 'flash-sale'}
          />
        </Suspense>
      </Reveal>
    </>
  )
}
