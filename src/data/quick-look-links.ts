import { POSTS } from './posts'
import type { BlogPost } from './posts'
import { QUICK_LOOK } from './quick-look'

/**
 * The cross-linking rule, in one field.
 *
 * SOURCE OF TRUTH for the blog ↔ Quick Look relationship. Read this map and
 * you get BOTH directions:
 *   - a post's "Products in this guide" block comes from its list here, and
 *   - a Quick Look page's "From our blog" block comes from the REVERSE lookup.
 *
 * Never mirror the relationship anywhere else — not in products.ts, not in
 * quick-look.ts, not in a page component.
 *
 * RULES (standing rules — see memory.md):
 * - A post may list at most MAX_PRODUCTS_PER_POST product slugs, and only ones
 *   the article genuinely covers (a dedicated section or a real evaluation).
 *   A passing name-drop does not count.
 * - A Quick Look page shows at most MAX_POSTS_PER_QUICK_LOOK posts.
 * - Every slug must match a real product slug AND have a Quick Look entry;
 *   scripts/check-quick-look.js fails the build otherwise.
 * - Keys are blog post slugs. A key that matches no post fails the build too.
 */
export const MAX_PRODUCTS_PER_POST = 5
export const MAX_POSTS_PER_QUICK_LOOK = 2

export const POST_PRODUCT_LINKS: Record<string, string[]> = {
  // "7 Best Noise-Canceling Headphones for Every Budget (2026)" evaluates the
  // XM5 directly against the alternatives, so it is a genuine cover.
  'best-noise-canceling-headphones': ['sony-wh-1000xm5-headphones'],
  // The buying guide explains what flagship ANC does and prices the trade-off
  // using the XM5 as its reference model.
  'noise-canceling-headphones-buying-guide': ['sony-wh-1000xm5-headphones'],
  // The HomeView explainer reports the same Apple announcement this spec sheet
  // documents, so the spec sheet's "From our blog" block points back at it.
  // (The spec sheet is informational: it carries no purchase path, so this
  // mapping never produces a buy link on either page.)
  'apple-homeview-price-release-date-features': ['apple-homeview-smart-display'],
  // Batch 4. Each of these posts covers the product with a deal card of its
  // own, so the spec sheet's "From our blog" block points back at a real
  // evaluation rather than a passing mention.
  'usb-c-accessories-under-50': ['ugreen-usb-c-hub-5-in-1'],
  'how-to-choose-usb-c-hub': ['ugreen-usb-c-hub-5-in-1'],
  'best-mechanical-keyboards-2026': ['aula-f75-pro-wireless-keyboard'],
  'foldable-phones-2026': ['samsung-galaxy-z-fold7-256gb'],
  // The comparison post sets HomeView against the Alexa and Google screens, so
  // it covers the same spec sheet from a different angle.
  'apple-homeview-vs-echo-show-nest-hub': ['apple-homeview-smart-display'],
}

/** Product slugs a post covers, filtered to ones with a Quick Look page. */
export function getProductsForPost(postSlug: string): string[] {
  return (POST_PRODUCT_LINKS[postSlug] ?? []).filter((slug) => slug in QUICK_LOOK)
}

/**
 * Reverse lookup: the posts that cover a product, newest first. Used by the
 * Quick Look "From our blog" block.
 */
export function getPostsForProduct(productSlug: string, limit = MAX_POSTS_PER_QUICK_LOOK): BlogPost[] {
  const matching = POSTS.filter((post) =>
    (POST_PRODUCT_LINKS[post.slug] ?? []).includes(productSlug),
  )
  return [...matching]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

/** Blog post href — TARGET stores blog URLs under /blog/<slug>. */
export const postHref = (post: Pick<BlogPost, 'slug'>): string => `/blog/${post.slug}`
