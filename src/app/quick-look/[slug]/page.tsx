export const revalidate = 21600

// Only slugs with a Quick Look entry are real pages: an unknown product slug is
// a 404, not a 200 that happens to render a not-found view.
export const dynamicParams = false

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { QUICK_LOOK_SLUGS, getQuickLookImages, resolveQuickLook } from '@/data/quick-look'
import { getQuickLookGuide } from '@/data/quick-look-content'
import { productImageAlt, quickLookGalleryAlts } from '@/lib/imageAlt'
import { SITE, SITE_URL } from '@/lib/site'
import {
  quickLookFaqSchema,
  quickLookMetaDescription,
  quickLookMetaTitle,
} from '@/lib/quick-look-schema'
import QuickLookDetail from '@/components/QuickLookDetail'
import QuickLookGuideSection from '@/components/QuickLookGuide'

interface QuickLookPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return QUICK_LOOK_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: QuickLookPageProps): Promise<Metadata> {
  const { slug } = await params
  const view = resolveQuickLook(slug)
  if (!view) return { title: 'Spec sheet not found' }
  const { entry, product } = view

  const title = entry.metaTitle ?? quickLookMetaTitle(entry.displayName)
  const description = quickLookMetaDescription(entry)
  const url = `${SITE_URL}/quick-look/${product.slug}`

  return {
    title,
    description,
    keywords: [product.primaryKeyword, ...(product.secondaryKeywords ?? [])].filter(
      (keyword): keyword is string => Boolean(keyword),
    ),
    alternates: { canonical: `/quick-look/${product.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: SITE.brand,
      ...(product.imageUrl
        ? {
            images: [
              {
                url: `${SITE_URL}${product.imageUrl}`,
                width: 1200,
                height: 1200,
                alt: productImageAlt(product),
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: product.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(product.imageUrl ? { images: [`${SITE_URL}${product.imageUrl}`] } : {}),
    },
  }
}

/**
 * Quick Look detail page — /quick-look/<product-slug>.
 *
 * A spec sheet rather than a second shop page: the product's own catalog record
 * supplies every fact, the data layer supplies the grouped spec table, and the
 * written guide (when one exists for the slug) supplies the long-form section.
 * Products without a guide still render the spec sheet; they just have no guide
 * section, so no thin pages ship.
 */
export default async function QuickLookProductPage({ params }: QuickLookPageProps) {
  const { slug } = await params
  const view = resolveQuickLook(slug)
  if (!view) notFound()
  // `product` is the catalog record for a linked entry, or the Product-shaped
  // view built from a standalone entry's own fields (see src/data/quick-look.ts).
  const { entry, product } = view

  const guide = getQuickLookGuide(slug)
  const images = getQuickLookImages(entry)
  // Hand-written per-image alt from the entry wins at its own position (see
  // quickLookGalleryAlts); positions without one fall back to the generated
  // gallery alt, so a gallery of one keeps the plain product alt.
  const imageAlts = quickLookGalleryAlts(entry.imageAlts, product, images.length)

  return (
    <>
      {/* No Product JSON-LD on this page (memory.md rule 4c). Google's Product
          snippet needs `offers`, `review` or `aggregateRating`, and this page
          has none of the three to give: no price is shown, nothing is sold on
          site, and the site does not test products, so there is no review or
          rating of its own. Amazon's ratings are Amazon's and are never
          re-published as ours. The FAQPage markup below stays. */}
      {/* FAQ markup is built from the SAME array the guide renders, so the
          marked-up questions match the visible text exactly. */}
      {guide && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(quickLookFaqSchema(guide.faqs)) }}
        />
      )}

      {/* No breadcrumb trail on this page, visible or marked up (memory.md rule
          4c): the H1 in the title block below is the first thing a visitor or a
          crawler reaches. The listing page /quick-look keeps its own. */}
      <QuickLookDetail product={product} entry={entry} images={images} imageAlts={imageAlts} />

      {guide && <QuickLookGuideSection guide={guide} productSlug={product.slug} />}
    </>
  )
}
