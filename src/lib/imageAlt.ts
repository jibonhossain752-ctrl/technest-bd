import type { BlogPost, BlogPostImage } from '@/data/posts'
import type { Product } from '@/data/products'

/**
 * Single source of truth for image alt text.
 *
 * Rule 0: alt that was written by hand always wins — `altText` on a post,
 * `alt` on an in-body image, `imageAlt` on a deal, `altText` on a product.
 * Those were written while looking at the image, so nothing here ever
 * overwrites them. The fallbacks below only fill in for alt that is missing,
 * empty or generic, and they never describe what an image shows: they reuse
 * wording that already exists in data (post title, nearest heading, product
 * name) so nothing is invented.
 *
 * Alt text is capped at ~125 characters, and only generated alt is shortened —
 * hand-written alt is passed through untouched.
 */

/** The site name exactly as the logo link and site title spell it. */
export const SITE_NAME = 'GadgetErea'

/** Logo in an icon-only link. */
export const LOGO_ALT = SITE_NAME

/** Purely decorative images: tracking pixels, posters with an adjacent title. */
export const DECORATIVE_ALT = ''

const MAX_ALT_LENGTH = 125

/** Alt strings that carry no information about the image. */
const GENERIC_ALT =
  /^(?:image|photo|picture|pic|img|screenshot|thumbnail|thumb|featured image|banner|graphic|logo)$/i

/** "[anything] — featured image" style suffixes say nothing either. */
const GENERIC_SUFFIX = /\s[-–—]\s*(?:featured image|video thumbnail|image|photo)$/i

/** A bare file name is not alt text. */
const FILENAME_ALT = /\.(?:avif|gif|jpe?g|png|webp)$/i

/** True when a value fails to describe anything (missing, empty or boilerplate). */
export function isGenericAlt(value?: string | null): boolean {
  if (!value) return true
  const text = value.trim()
  if (!text) return true
  return GENERIC_ALT.test(text) || GENERIC_SUFFIX.test(text) || FILENAME_ALT.test(text)
}

/** Shorten generated alt at a word boundary; never applied to hand-written alt. */
function clampGenerated(value: string): string {
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length <= MAX_ALT_LENGTH) return text
  const clipped = text.slice(0, MAX_ALT_LENGTH - 1)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

/**
 * Hand-written alt wins; otherwise the fallback is used (and trimmed to length).
 * The fallback is always wording that already exists elsewhere in the data.
 */
function preferAuthored(value: string | undefined | null, fallback: string): string {
  const authored = value?.trim()
  if (authored && !isGenericAlt(authored)) return authored
  return clampGenerated(fallback)
}

const isImageBlock = (
  block: BlogPost['content'][number],
): block is BlogPostImage =>
  typeof block === 'object' && block !== null && 'image' in block && 'alt' in block

/** Text of the nearest heading / subheading above a content block. */
function nearestHeadingAbove(content: BlogPost['content'], index: number): string | undefined {
  for (let i = index - 1; i >= 0; i -= 1) {
    const block = content[i]
    if (typeof block !== 'object' || block === null) continue
    if ('heading' in block) return block.heading
    if ('subheading' in block) return block.subheading
  }
  return undefined
}

/**
 * Blog hero. The post title carries the keyword already, so it is not repeated.
 * The listing card renders the same hero image, so it uses the same alt.
 */
export function blogHeroAlt(post: Pick<BlogPost, 'title' | 'altText'>): string {
  return preferAuthored(post.altText, post.title)
}

/** In-body image: authored alt, else the nearest preceding heading, else the title. */
export function blogInlineAlt(post: BlogPost, image: BlogPostImage): string {
  const index = post.content.indexOf(image)
  const heading = index >= 0 ? nearestHeadingAbove(post.content, index) : undefined
  return preferAuthored(image.alt, heading ?? post.title)
}

export interface BlogImageAlts {
  /** Alt for the hero image, or null when the post has no hero. */
  hero: string | null
  /** Alt per content block index; only image blocks have an entry. */
  inline: Map<number, string>
}

/**
 * All image alt text for one post, so a page never shows the same description
 * for two different pictures: a *generated* alt that repeats earlier alt on the
 * page gets ", photo N of M" appended. Hand-written alt is left alone.
 */
export function blogImageAlts(post: BlogPost): BlogImageAlts {
  const ordered: { index: number; alt: string; authored: boolean }[] = []

  if (post.heroImage) {
    ordered.push({
      index: -1,
      alt: blogHeroAlt(post),
      authored: !isGenericAlt(post.altText),
    })
  }
  post.content.forEach((block, index) => {
    if (!isImageBlock(block)) return
    ordered.push({
      index,
      alt: blogInlineAlt(post, block),
      authored: !isGenericAlt(block.alt),
    })
  })

  const seen = new Set<string>()
  const inline = new Map<number, string>()
  let hero: string | null = null

  ordered.forEach((item, position) => {
    let alt = item.alt
    if (seen.has(alt.toLowerCase()) && !item.authored) {
      alt = clampGenerated(`${alt}, photo ${position + 1} of ${ordered.length}`)
    }
    seen.add(item.alt.toLowerCase())
    if (item.index === -1) hero = alt
    else inline.set(item.index, alt)
  })

  return { hero, inline }
}

/**
 * Product image — cards, detail page, cart and checkout all pass the same
 * product, so one image keeps one alt everywhere. Products have no separate
 * brand or type field, so the product name is the whole fallback.
 */
export function productImageAlt(product: Pick<Product, 'name' | 'altText'>): string {
  return preferAuthored(product.altText, product.name)
}

/**
 * Product GALLERY / thumbnail image (Quick Look pages).
 *
 * - With a verified variant label: "<product alt> in <variant>".
 * - Otherwise "<product alt>, photo N of M" — so every image in one gallery
 *   gets its own position-accurate alt instead of repeating the hero's.
 *
 * Never describes angle, contents or specs: those words are not in the data,
 * and inventing them is exactly what this helper exists to prevent.
 */
export function productGalleryImageAlt(
  product: Pick<Product, 'name' | 'altText'>,
  position: number,
  total: number,
  variantLabel?: string,
): string {
  const base = productImageAlt(product)
  const variant = variantLabel?.trim()
  if (variant) {
    return total > 1
      ? clampGenerated(`${base} in ${variant}, photo ${position + 1} of ${total}`)
      : clampGenerated(`${base} in ${variant}`)
  }
  return clampGenerated(`${base}, photo ${position + 1} of ${total}`)
}

/**
 * Deal card image. Pass the product when the product's own image is the one
 * rendered (that is what `imageUrl` decides on the blog templates); otherwise
 * the deal's own image alt, then its name, applies.
 */
export function dealImageAlt(
  deal: { name: string; imageAlt?: string },
  product?: Pick<Product, 'name' | 'altText'>,
): string {
  if (product) return preferAuthored(product.altText, product.name)
  return preferAuthored(deal.imageAlt, deal.name)
}

/**
 * Video posters sit next to the visible video title, so they stay decorative —
 * the title is already announced by the text beside them.
 */
export const VIDEO_POSTER_ALT = DECORATIVE_ALT

/** Accessible name for a play control, from data. */
export function playButtonLabel(videoTitle: string): string {
  return `Play video: ${videoTitle}`
}
