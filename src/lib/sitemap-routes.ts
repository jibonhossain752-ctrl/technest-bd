import type { MetadataRoute } from 'next'
import { PRODUCTS, SHOP_VIEWS, getShopViewProducts } from '@/data/products'
import type { Product } from '@/data/products'
import { POSTS } from '@/data/posts'
import type { BlogPost, BlogPostImage } from '@/data/posts'
import { CATEGORIES } from '@/data/categories'
import { QUICK_LOOK_SLUGS, getQuickLookProduct } from '@/data/quick-look'
import { SITE_URL } from '@/lib/site'

/**
 * Single source of truth for the XML sitemap.
 *
 * Every URL is derived from the same data the pages themselves render:
 * `posts.ts` for blog posts, `products.ts` for products and shop views,
 * `categories.ts` for category pages, and `STATIC_PAGES` below for the
 * hand-written pages that have no data file behind them. Publishing a post,
 * product or category therefore lands in the sitemap with no manual step.
 */

// The canonical origin lives in src/lib/site.ts (single source of truth for
// brand, domain, locale, currency and country) and is re-exported here so the
// sitemap, robots and coverage check all read the same value.
export const SITE = SITE_URL

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

export interface SitemapEntry {
  /** Site-relative path, e.g. `/blog/some-post`. */
  path: string
  /** Real content date. Never the build time — omitted when unknown. */
  lastModified?: Date
  changeFrequency: ChangeFrequency
  priority: number
  /** Site-relative image paths the page references. */
  images?: string[]
}

/**
 * Every hand-written page that belongs in the sitemap. A new `page.tsx` under
 * `src/app` fails the build until it is listed here (see sitemap-coverage.ts).
 */
export const STATIC_PAGES: {
  path: string
  changeFrequency: ChangeFrequency
  priority: number
}[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/deals', changeFrequency: 'daily', priority: 0.9 },
  { path: '/quick-look', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
]

/**
 * Pages whose copy is not generated from a data file, so there is no content
 * date to derive. These are the dates the copy was last meaningfully edited —
 * update the date when the page changes.
 */
const STATIC_CONTENT_DATES: Record<string, string> = {
  // Quick Look section created 2026-10-14; bump when the listing copy changes.
  '/quick-look': '2026-10-14',
  '/about': '2026-10-05',
  '/contact': '2026-10-05',
  '/faq': '2026-08-11',
}

/**
 * Shop "views" that are deliberately kept out of the sitemap: `/shop/featured`
 * renders the whole catalogue, the same set of products as `/shop`, so listing
 * both would be a soft duplicate.
 */
export const EXCLUDED_SHOP_VIEWS: string[] = ['featured']

const toDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Newest of the supplied dates, ignoring the missing ones. */
const latest = (dates: (Date | undefined)[]): Date | undefined => {
  const times = dates
    .filter((date): date is Date => date != null)
    .map((date) => date.getTime())
  return times.length === 0 ? undefined : new Date(Math.max(...times))
}

/** A post's real revision date: lastUpdated when it has one, else the publish date. */
const postDate = (post: BlogPost): Date | undefined =>
  toDate(post.lastUpdated) ?? toDate(post.date)

const productDate = (product: Product): Date | undefined => toDate(product.addedAt)

const LATEST_POST_DATE = latest(POSTS.map(postDate))
const LATEST_PRODUCT_DATE = latest(PRODUCTS.map(productDate))

const isDiscounted = (product: Product): boolean =>
  product.price != null && product.oldPrice != null && product.oldPrice > product.price

const LATEST_DEAL_DATE = latest(PRODUCTS.filter(isDiscounted).map(productDate))

/**
 * Index pages change when the content they list changes, so their dates come
 * from the data; the rest use a recorded copy date.
 */
const STATIC_LAST_MODIFIED: Record<string, Date | undefined> = {
  '/': latest([LATEST_POST_DATE, LATEST_PRODUCT_DATE]),
  '/shop': LATEST_PRODUCT_DATE,
  '/deals': LATEST_DEAL_DATE ?? LATEST_PRODUCT_DATE,
  '/blog': LATEST_POST_DATE,
}

const staticLastModified = (pagePath: string): Date | undefined =>
  pagePath in STATIC_LAST_MODIFIED
    ? STATIC_LAST_MODIFIED[pagePath]
    : toDate(STATIC_CONTENT_DATES[pagePath])

const staticEntries = (): SitemapEntry[] =>
  STATIC_PAGES.map((page) => ({
    ...page,
    lastModified: staticLastModified(page.path),
  }))

const categoryEntries = (): SitemapEntry[] =>
  CATEGORIES.filter((category) => category.count > 0).map((category) => ({
    path: `/shop/${category.slug}`,
    lastModified: latest(
      PRODUCTS.filter((p) => p.categorySlug === category.slug).map(productDate),
    ),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

const shopViewEntries = (): SitemapEntry[] =>
  SHOP_VIEWS.filter((view) => !EXCLUDED_SHOP_VIEWS.includes(view.slug)).map(
    (view) => ({
      path: `/shop/${view.slug}`,
      lastModified: latest(getShopViewProducts(view.slug).map(productDate)),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }),
  )

const productEntries = (): SitemapEntry[] =>
  PRODUCTS.map((product) => ({
    path: `/product/${product.slug}`,
    lastModified: productDate(product),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: product.imageUrl ? [product.imageUrl] : undefined,
  }))

/**
 * Quick Look spec sheets — one URL per product that has an entry in the Quick
 * Look data layer, with the product photo declared for Google Image Search.
 * Adding an entry there puts the URL in the sitemap with no edit here.
 */
const quickLookEntries = (): SitemapEntry[] =>
  QUICK_LOOK_SLUGS.map((slug) => {
    const product = getQuickLookProduct(slug)
    return {
      path: `/quick-look/${slug}`,
      lastModified: product ? productDate(product) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: product?.imageUrl ? [product.imageUrl] : undefined,
    }
  })

const blogEntries = (): SitemapEntry[] =>
  POSTS.map((post) => {
    const inlineImages = post.content
      .filter((block): block is BlogPostImage => typeof block === 'object' && 'image' in block && 'alt' in block)
      .map((block) => block.image)
    const images = [...(post.heroImage ? [post.heroImage] : []), ...inlineImages]
    return {
      path: `/blog/${post.slug}`,
      lastModified: postDate(post),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      images: images.length > 0 ? images : undefined,
    }
  })

/** Every URL that belongs in the sitemap, in crawl-priority order. */
export function getSitemapEntries(): SitemapEntry[] {
  return [
    ...staticEntries(),
    ...categoryEntries(),
    ...shopViewEntries(),
    ...productEntries(),
    ...quickLookEntries(),
    ...blogEntries(),
  ]
}

/**
 * Public pages that are built but intentionally left out of the sitemap.
 * Computed from the data, so an empty category or a newly excluded shop view
 * stays out automatically.
 */
export function getExcludedPublicPaths(): { path: string; reason: string }[] {
  const excluded: { path: string; reason: string }[] = []

  for (const view of SHOP_VIEWS) {
    if (EXCLUDED_SHOP_VIEWS.includes(view.slug)) {
      excluded.push({
        path: `/shop/${view.slug}`,
        reason: 'soft duplicate of /shop — renders the entire catalogue',
      })
    }
  }
  for (const category of CATEGORIES) {
    if (category.count === 0) {
      excluded.push({
        path: `/shop/${category.slug}`,
        reason: 'category has no products',
      })
    }
  }
  return excluded
}

/**
 * Dynamic routes and the data that fills them. The coverage check expands each
 * pattern with these lists, so a new dynamic route has to be mapped here before
 * it can ship.
 */
export const DYNAMIC_ROUTE_SOURCES: Record<string, () => string[]> = {
  '/blog/[slug]': () => POSTS.map((post) => `/blog/${post.slug}`),
  '/product/[slug]': () => PRODUCTS.map((product) => `/product/${product.slug}`),
  '/quick-look/[slug]': () => QUICK_LOOK_SLUGS.map((slug) => `/quick-look/${slug}`),
  '/shop/[category]': () => [
    ...CATEGORIES.map((category) => `/shop/${category.slug}`),
    ...SHOP_VIEWS.map((view) => `/shop/${view.slug}`),
  ],
}
