import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Product } from '@/data/products'
import { PRODUCTS, SHOP_VIEWS, getShopViewBySlug } from '@/data/products'
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from '@/data/categories'
import ShopCatalog from '@/components/ShopCatalog'
import Breadcrumb from '@/components/ui/Breadcrumb'
import Reveal from '@/components/ui/Reveal'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

interface SeoMeta {
  title: string
  description: string
  intro: string
}

const SEO_META: Record<string, SeoMeta> = {
  laptops: {
    title: 'Trending Gadgets – Laptops & PCs',
    description:
      'Trending laptops and PCs at GadgetErea — powerful machines for work and play. Shop genuine laptops with official warranty and fast US delivery.',
    intro:
      'Looking for trending gadgets to upgrade your desk? Our Laptops & PCs collection features fast, reliable machines for work, study and gaming — every one genuine, warrantied and delivered fast across the USA.',
  },
  smartphones: {
    title: 'Trending Gadgets & Amazon Finds – Smartphones',
    description:
      'Amazon finds gadgets shoppers love — start with smartphones. Shop trending unlocked phones and bundles at GadgetErea with warranty and fast US delivery.',
    intro:
      'If you hunt the best Amazon finds gadgets, the smartphone aisle is where the biggest wins live. Our phones are unlocked, genuine and backed by official warranty — bundle deals often include gift cards.',
  },
  'audio-wearables': {
    title: 'Trending Gadgets – Audio & Wearables',
    description:
      'Trending gadgets for your ears — noise-canceling headphones, open-ear earbuds and wearable audio at GadgetErea. Genuine picks, official warranty, fast delivery.',
    intro:
      'From noise-canceling headphones to open-ear earbuds, this is where trending gadgets meet everyday listening. Every pair is genuine, warranty-backed and shipped fast to your door.',
  },
  gaming: {
    title: 'Cool Tech Gadgets Under $50 – Gaming Gear',
    description:
      'Cool tech gadgets under $50 for gamers — keyboards, controllers and console upgrades at GadgetErea. Genuine gaming gear with official warranty and fast delivery.',
    intro:
      'Gamers don’t need a huge budget to feel the upgrade. Our Gaming Gear picks show off cool tech gadgets under $50 that genuinely change how you play — and bigger-ticket consoles when you want to go further.',
  },
  accessories: {
    title: 'Cool Tech Gadgets Under $50 – Accessories',
    description:
      'Cool tech gadgets under $50 — USB-C hubs, chargers, power banks and desk accessories at GadgetErea. Genuine, warranty-backed.',
    intro:
      'The best Amazon finds are often small: hubs, chargers, power banks and desk helpers. Our Accessories aisle is packed with cool tech gadgets under $50 that make a real difference every day.',
  },
  networking: {
    title: 'Useful Gadgets for Home – Networking',
    description:
      'Useful gadgets for home networking — Wi-Fi boosters, routers and UPS backup at GadgetErea. Genuine networking gear with official warranty and fast US delivery.',
    intro:
      'A dead spot in the living room or a router that drops calls? The useful gadgets for home in our Networking collection fix real problems — tested, genuine and backed by warranty.',
  },
  cameras: {
    title: 'Amazon Finds Gadgets – Cameras & Webcams',
    description:
      'Amazon finds gadgets for creators — 4K webcams, vlogging cameras and AI-tracking camcorders at GadgetErea. Genuine cameras with official warranty and fast delivery.',
    intro:
      'Whether you stream, vlog or take meetings, the cameras here are the Amazon finds gadgets creators keep recommending. 4K webcams and AI-tracking models — genuine, with official warranty.',
  },
  'smart-home': {
    title: 'Useful Gadgets for Home – Smart Home',
    description:
      'Useful gadgets for home — smart speakers, lighting and home tech at GadgetErea. Genuine smart home devices with official warranty and fast US delivery.',
    intro:
      'From kid-friendly smart speakers to 3-in-1 chargers, our Smart Home shelf is full of useful gadgets for home that make daily life easier — all genuine and warranty-backed.',
  },
  featured: {
    title: 'Trending Gadgets – Featured Picks',
    description:
      'Our featured trending gadgets — hand-picked best-sellers, cool tech gadgets under $50 and Amazon finds at GadgetErea. Genuine products, fast US delivery.',
    intro:
      'These are the trending gadgets our team picks every week — the best Amazon finds, the coolest tech under $50 and the products customers keep coming back for.',
  },
  'flash-sale': {
    title: 'Gadget Deals Online – Flash Sale',
    description:
      'Gadget deals online with the deepest discounts — flash sale prices on trending gadgets at GadgetErea. Time-limited, verified and updated weekly.',
    intro:
      'Flash sale prices move fast — when they’re gone, they’re gone. For gadget deals online worth the refresh, this is the page to watch: verified prices, genuine products, no gimmicks.',
  },
  'new-arrivals': {
    title: 'Trending Gadgets – New Arrivals',
    description:
      'New trending gadgets just landed — the latest phones, headphones and smart home tech at GadgetErea. Be first with genuine products and fast US delivery.',
    intro:
      'Fresh off the truck: the newest trending gadgets to hit the market, from foldables to AI-tracking webcams. New arrivals always ship fast, with official warranty included.',
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
      url: `https://gadgeterea.com/shop/${category}`,
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
    products =
      view.slug === 'featured'
        ? PRODUCTS
        : view.slug === 'flash-sale'
          ? PRODUCTS.filter((p) => p.isFlashSale)
          : PRODUCTS.filter((p) => p.isNew)
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
              <h1>{title}</h1>
              <p className="category-seo-intro">{seo.intro}</p>
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
