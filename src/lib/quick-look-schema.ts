import { SITE, SITE_URL, AFFILIATE_CTA } from './site'
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
 *   both wrong and against the site's rules.
 * - `offers` appears ONLY when a price was verified on a known date
 *   (`priceCheckedOn`). Without that date there is no confirmed price, so the
 *   whole offers block is omitted rather than emitting a broken or stale offer.
 * - The FAQPage markup is built from the SAME array the page renders, so the
 *   marked-up questions and answers match the visible text exactly.
 */

/** Product schema for a Quick Look page. Never carries ratings or reviews. */
export function quickLookProductSchema(product: Product, entry: QuickLookEntry) {
  const url = `${SITE_URL}/quick-look/${product.slug}`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: product.name.split(' ')[0] },
    category: product.category,
    url,
    // Specs the page actually prints, kept as additional properties so the
    // markup never claims more than the visible table does.
    additionalProperty: entry.specs
      .flatMap((group) => group.rows)
      .map((row) => ({
        '@type': 'PropertyValue',
        name: row.label,
        value: row.value,
      })),
    ...(product.imageUrl ? { image: [`${SITE_URL}${product.imageUrl}`] } : {}),
  }

  // A price is only ever marked up when it was verified on a dated source and
  // the page displays the same dated figure.
  if (entry.priceCheckedOn && product.price != null) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: SITE.currency,
      price: product.price,
      availability:
        entry.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/PreOrder',
      url,
    }
  }

  return schema
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
 * Meta title for a Quick Look page: "{Product} Specs, Price & Review",
 * trimmed to stay under 60 characters. The product name comes first because it
 * is the search term; the suffix is dropped, then softened, when the name is
 * long enough to push the title over the limit.
 *
 * Pass the entry's `displayName` (brand + model), not the full catalog name —
 * the catalog name is an Amazon listing title and blows the 60-character limit
 * on almost every product.
 */
export function quickLookMetaTitle(displayName: string): string {
  const full = `${displayName} Specs, Price & Review`
  if (full.length <= 60) return full
  const short = `${displayName} Specs & Review`
  if (short.length <= 60) return short
  return `${displayName} Specs`.slice(0, 60).trimEnd()
}

/**
 * Meta description for a Quick Look page. Deliberately carries no price: the
 * page itself shows none, and a description quoting a figure that has moved is
 * worse than one that sends the reader to the listing.
 */
export function quickLookMetaDescription(product: Product, entry: QuickLookEntry): string {
  const firstGroup = entry.specs[0]
  const lead = firstGroup?.rows
    .slice(0, 3)
    .map((row) => `${row.label.toLowerCase()}: ${row.value}`)
    .join(', ')
  const base = lead
    ? `${product.name} specs and review: ${lead}. See the full spec sheet and check the current price on Amazon.`
    : `${product.name} specs and review: the full spec sheet, who it suits and check the current price on Amazon.`
  return base.length <= 160 ? base : `${base.slice(0, 157).trimEnd()}…`
}

/** Shared CTA label so every buy button on the site says the same thing. */
export const QUICK_LOOK_CTA = AFFILIATE_CTA
