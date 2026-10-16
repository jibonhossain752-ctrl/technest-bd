import { AFFILIATE_CTA } from './site'
import type { QuickLookEntry } from '@/data/quick-look'

/**
 * JSON-LD builders for Quick Look pages, plus the metadata patterns that go
 * with them.
 *
 * RULES (standing rules — see memory.md):
 * - No Product JSON-LD on a Quick Look page. Google's Product snippet requires
 *   one of `offers`, `review` or `aggregateRating`, and this page truthfully has
 *   none of the three: the store sells nothing on site, so there is no offer and
 *   no availability to claim; the page shows no price; and the site does not
 *   test products, so it has no review or rating of its own to publish. Amazon's
 *   star ratings and review counts belong to Amazon and are never re-published
 *   as ours (memory.md rule 5). A Product node carrying none of the three
 *   properties is a critical Product-snippet error in Search Console, so the
 *   node was removed (2026-10-17, memory.md rule 4c) rather than padded out with
 *   data the page does not have. The FAQPage markup stays.
 * - The FAQPage markup is built from the SAME array the page renders, so the
 *   marked-up questions and answers match the visible text exactly.
 */

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
