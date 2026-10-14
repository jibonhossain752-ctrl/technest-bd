import { SITE_URL, AFFILIATE_CTA } from './site'
import type { Product } from '@/data/products'
import type { QuickLookEntry } from '@/data/quick-look'

/**
 * JSON-LD builders for Quick Look pages, plus the metadata patterns that go
 * with them.
 *
 * RULES (standing rules — see memory.md):
 * - The Product markup mirrors only what the page shows. No `aggregateRating`
 *   and no `review` are emitted, ever: Amazon star ratings and review counts
 *   are Amazon's data, not ours, and re-publishing them as our own rating is
 *   both wrong and against the site's rules. The detail page's Spec Score badge
 *   is a completeness indicator, not a rating, so it never reaches the markup.
 * - No `offers` block at all: this store shows no price and sells nothing on
 *   site, so the Product node carries no offer and no availability claim.
 * - The FAQPage markup is built from the SAME array the page renders, so the
 *   marked-up questions and answers match the visible text exactly.
 */

/** Product schema for a Quick Look page. Never carries ratings, reviews or offers. */
export function quickLookProductSchema(product: Product, entry: QuickLookEntry) {
  const url = `${SITE_URL}/quick-look/${product.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    // A standalone entry names its own brand; a linked entry falls back to the
    // first word of the catalog name, which is the maker for every product in
    // this catalog.
    brand: { '@type': 'Brand', name: entry.product?.brand ?? product.name.split(' ')[0] },
    category: product.category,
    url,
    // Specs the page actually prints, kept as additional properties so the
    // markup never claims more than the visible table does.
    additionalProperty: entry.specs
      .flatMap((group) => group.rows ?? [])
      .map((row) => ({
        '@type': 'PropertyValue',
        name: row.label,
        value: row.value,
      })),
    ...(product.imageUrl ? { image: [`${SITE_URL}${product.imageUrl}`] } : {}),
  }
}

/** FAQPage schema — pass the EXACT array the page renders. */
export function quickLookFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

/**
 * Meta title for a Quick Look page: "{Product} Specs & Buying Guide", trimmed to
 * stay under 60 characters. The product name comes first because it is the
 * search term; the suffix falls back to "Specs & Features" when the name is long
 * enough to push the title over the limit.
 *
 * Deliberately never says "Price" (the page shows none) or "Review" (we do not
 * review the product). Pass the entry's `displayName` (brand + model), not the
 * full catalog name — the catalog name is an Amazon listing title and blows the
 * 60-character limit on almost every product.
 */
export function quickLookMetaTitle(displayName: string): string {
  const full = `${displayName} Specs & Buying Guide`
  if (full.length <= 60) return full
  const short = `${displayName} Specs & Features`
  if (short.length <= 60) return short
  return `${displayName} Specs`.slice(0, 60).trimEnd()
}

/**
 * Meta description for a Quick Look page. Hand-written per product and stored
 * on the entry (`metaDescription`); the guard checks the 120–160 character
 * limit, so nothing is trimmed here. Carries no price: the page itself shows
 * none, and a figure that has moved is worse than none at all.
 */
export function quickLookMetaDescription(entry: QuickLookEntry): string {
  return entry.metaDescription
}

/** Shared CTA label so every buy button on the site says the same thing. */
export const QUICK_LOOK_CTA = AFFILIATE_CTA
