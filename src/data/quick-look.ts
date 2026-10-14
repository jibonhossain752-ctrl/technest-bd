import { PRODUCTS } from './products'
import type { Product } from './products'

/**
 * Quick Look data layer.
 *
 * A Quick Look page is a spec-sheet view of a product, and an entry can get
 * there in one of two ways:
 *
 * 1. LINKED — the `slug` matches a record in the GadgetErea catalog
 *    (`src/data/products.ts`). Nothing is duplicated: the entry adds only what
 *    the catalog does not carry (the grouped spec table, the detail-page
 *    panels, the verified-spec source note and the status flag), and its
 *    category, price and rating come from that record.
 * 2. STANDALONE — the product is not in the shop at all, so the entry carries
 *    its own product facts in `product` (name, category, buyUrl, images,
 *    description, brand/model) and `resolveQuickLook()` builds the
 *    Product-shaped view the components already take. A standalone product is
 *    deliberately NEVER added to `src/data/products.ts`: it gets no shop card
 *    and no /product page, only its Quick Look page.
 *
 * Both shapes are resolved through `resolveQuickLook()`. Callers that need a
 * product record should use that rather than reaching into PRODUCTS, so a
 * standalone entry works everywhere a linked one does.
 *
 * RULES (standing rules — see memory.md):
 * - Specs are grouped by category and keyed by the product's slug. Every value
 *   must come from the product's own listing data or a named manufacturer /
 *   retailer source recorded in `specSource`. Never guess a number, a rating
 *   or a warranty term: a missing value stays out of the table.
 * - No price is stored here. Amazon prices change constantly, so the UI shows
 *   the call to action instead (see src/lib/site.ts). If a price is ever added
 *   it must ship with `priceCheckedOn` and be displayed as "as of <date>".
 * - `metaDescription` is required and hand-written per product: the guard in
 *   scripts/check-quick-look.js fails the build when it is missing, outside
 *   120–160 characters, or mentions a price or a review.
 * - Pages exist only for products listed in QUICK_LOOK. A product without an
 *   entry has no Quick Look page (the route 404s), so no thin pages ship.
 */

/** 'available' = shipping now; 'upcoming' = announced, not yet on sale. */
export type QuickLookStatus = 'available' | 'upcoming'

export interface QuickLookSpecRow {
  label: string
  value: string
}

export interface QuickLookSpecGroup {
  /** Group heading in the spec table, e.g. "Audio". */
  group: string
  /** Label/value pairs. Used by most groups. */
  rows?: QuickLookSpecRow[]
  /** Bullet items, for groups that read as a list (e.g. notable limitations). */
  items?: string[]
}

export interface QuickLookOption {
  label: string
  /** Short, factual note about the option — never a price. */
  note?: string
}

/**
 * A variant dimension the product really has (model version, colour, bundle).
 * Rendered as the detail page's option chips. It is informational only: this
 * store shows no price, so a selection here never changes a figure.
 */
export interface QuickLookVariant {
  label: string
  options: QuickLookOption[]
}

/**
 * The product facts a STANDALONE entry carries itself, because it has no record
 * in src/data/products.ts. Only what the page actually renders is here — and
 * never a price without `priceCheckedOn`, never a rating or review count that
 * did not come from the product's own listing data.
 */
export interface QuickLookProductFields {
  /** Full product name, as the manufacturer and the listing spell it. */
  name: string
  /** Shop category NAME, using the same names as src/data/categories.ts. */
  category: string
  /** Shop category SLUG — drives the aisle link on the card and in the guide. */
  categorySlug: string
  /** The product's own affiliate link. Required: the buy button is the exit. */
  buyUrl: string
  /** One-sentence description, used as the page lede and the card copy. */
  description: string
  /** Short scan-first lines, rendered as the page's highlight list. */
  features: string[]
  /** Manufacturer brand for the Product schema. Falls back to the name's first word. */
  brand?: string
  /** Emoji stand-in, used only when the entry has no images at all. */
  image?: string
  /** Alt text for the first gallery image. Falls back to the product name. */
  altText?: string
  /** Current price. Displayed ONLY together with `priceCheckedOn` (src/lib/site.ts). */
  price?: number | null
  /** List price, shown struck through only when it is higher than `price`. */
  oldPrice?: number
  /** Amazon star rating — always labelled as Amazon's, never as ours. */
  rating?: number | null
  /** Amazon review count, rendered only alongside a rating. */
  reviews?: number
  /** ISO date the price was checked against the listing. No date, no price. */
  priceCheckedOn?: string
  metaTitle?: string
  metaDescription?: string
  primaryKeyword?: string
  secondaryKeywords?: string[]
}

export interface QuickLookEntry {
  /**
   * The page's slug. For a LINKED entry this is a real product slug in
   * src/data/products.ts; for a STANDALONE entry it is its own slug and must
   * not collide with any product or Quick Look slug.
   */
  slug: string
  status: QuickLookStatus
  /**
   * Present ONLY on standalone entries (see the two shapes at the top of this
   * file). Linked entries leave it unset and take these facts from their
   * catalog record instead.
   */
  product?: QuickLookProductFields
  /**
   * Full grouped specification cards, rendered in order. Each group carries
   * either `rows` (label/value) or `items` (bullets), never neither.
   */
  specs: QuickLookSpecGroup[]
  /**
   * The five highlight cards across the top of the detail page: the facts a
   * buyer scans first. Values are short — one figure or one short phrase.
   */
  highlights: QuickLookSpecRow[]
  /** Variant dimensions with verified option labels. Omit when unverified. */
  variants?: QuickLookVariant[]
  /** The "Key specifications" panel beside the gallery. */
  keySpecs: QuickLookSpecRow[]
  /** The "Additional info" panel beside the gallery. */
  additionalInfo: QuickLookSpecRow[]
  /**
   * Extra gallery images beyond the product's own `imageUrl`. Only real files
   * that exist in `public/product-images/` may be listed.
   */
  images?: string[]
  /**
   * Purchasable option dimension (colour, bundle, capacity) when the product
   * really has one and the labels are verified. Left unset when unverified.
   */
  options?: QuickLookOption[]
  /**
   * Short, human product name used for the H1 and meta title — the brand plus
   * the model exactly as the listing spells them, without the listing's
   * marketing tail. Full catalog `name` stays the source for cards and schema.
   */
  displayName: string
  /**
   * Hand-written meta description, 120–160 characters, no price and no review
   * wording. The guard fails the build when it breaks those limits.
   */
  metaDescription: string
  /**
   * Where the spec values came from. Shown on the page as a plain-text note so
   * a reader can check them, and used by the guard script as a reminder that
   * every row needs a source.
   */
  specSource: string
  /**
   * ISO date the price was last verified. Absent on purpose for products whose
   * price has not been checked against a dated source — the page then shows no
   * price at all rather than a number that may be stale.
   */
  priceCheckedOn?: string
}

/**
 * Quick Look entries, keyed by product slug. Only products listed here get a
 * /quick-look/<slug> page.
 */
export const QUICK_LOOK: Record<string, QuickLookEntry> = {
  'sony-wh-1000xm5-headphones': {
    slug: 'sony-wh-1000xm5-headphones',
    displayName: 'Sony WH-1000XM5',
    status: 'available',
    // Values below come from Sony's own WH-1000XM5 specification sheet and help
    // guide (driver type/size, weight, battery and charge times, codecs,
    // ports, in-box contents, "the headset is not waterproof"). Feature names
    // that are not in the numbered spec list — Auto NC Optimizer, multipoint,
    // hands-free calling — come from the product's own Amazon listing data in
    // src/data/products.ts, which the catalog stores as real listing facts.
    specSource:
      "Sony's WH-1000XM5 help guide and specification sheet, plus Sony's WH-1000XM4 help guide, Bose's QuietComfort Ultra Headphones (2nd Gen) pages and Apple's AirPods Max 2 technical specifications — all checked against the manufacturers' own pages in October 2026, together with the product's Amazon listing data",
    metaDescription:
      'Sony WH-1000XM5 spec sheet: 30 mm drivers, up to 30 hours with noise canceling, LDAC and multipoint, and wired listening explained.',
    images: [
      '/product-images/sony-wh-1000xm5-headphones-front.webp',
      '/product-images/sony-wh-1000xm5-headphones-case.webp',
      '/product-images/sony-wh-1000xm5-headphones-laptop.webp',
      '/product-images/sony-wh-1000xm5-headphones-midnight-blue.webp',
    ],
    highlights: [
      { label: 'Driver', value: '30 mm' },
      { label: 'Playback', value: 'Up to 30 h' },
      { label: 'Weight', value: 'Approx. 250 g' },
      { label: 'Codecs', value: 'SBC, AAC, LDAC' },
      { label: 'Bluetooth', value: 'Version 5.2' },
    ],
    // Sony's help guide ships two box variants: the WH-1000XM5 with a carrying
    // case and the WH-1000XM5SA with a pouch. The chips are informational —
    // this store shows no price, so nothing here changes a figure.
    variants: [
      {
        label: 'Model',
        options: [
          { label: 'WH-1000XM5', note: 'Carrying case in the box' },
          { label: 'WH-1000XM5SA', note: 'Carrying pouch in the box' },
        ],
      },
    ],
    keySpecs: [
      { label: 'Driver unit', value: '30 mm, closed dynamic over-ear' },
      { label: 'Playback, canceling on', value: 'Up to 30 hours (AAC)' },
      { label: 'Playback, canceling off', value: 'Up to 40 hours (AAC)' },
      { label: 'Codecs', value: 'SBC, AAC, LDAC' },
      { label: 'Bluetooth', value: 'Version 5.2' },
      { label: 'Multipoint', value: 'Two devices connected at once' },
      { label: 'Wired listening', value: 'Headphone cable included' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Sony' },
      { label: 'Model', value: 'WH-1000XM5' },
      { label: 'Weight', value: 'Approx. 250 g (8.82 oz)' },
      { label: 'Charge time', value: 'Approx. 3.5 hours over USB Type-C' },
      { label: 'Quick charge', value: '3 min for about 1 hour of playback' },
      { label: 'In the box', value: 'Carrying case, headphone cable and USB Type-C cable' },
    ],
    specs: [
      {
        group: 'Audio',
        rows: [
          { label: 'Type', value: 'Closed, dynamic over-ear' },
          { label: 'Driver unit', value: '30 mm' },
          { label: 'Volume control', value: 'Touch sensor control panel' },
          { label: 'Supported codecs', value: 'SBC, AAC, LDAC' },
        ],
      },
      {
        group: 'Noise canceling & calls',
        rows: [
          { label: 'Noise canceling', value: 'Dual-processor system with multiple microphones' },
          { label: 'Auto NC Optimizer', value: 'Yes — adapts to your environment and how you wear it' },
          { label: 'Ambient sound mode', value: 'Yes' },
          { label: 'Hands-free calling', value: 'Yes — built-in microphones, no boom arm' },
        ],
      },
      {
        group: 'Battery & charging',
        rows: [
          { label: 'Music playback (noise canceling on)', value: 'Up to 30 hours' },
          { label: 'Music playback (noise canceling off)', value: 'Up to 40 hours' },
          { label: 'Charging', value: 'USB-C' },
          { label: 'Charge time', value: 'Approx. 3.5 hours' },
          { label: 'Quick charge', value: '10 minutes for up to 5 hours of playback' },
        ],
      },
      {
        group: 'Connectivity',
        rows: [
          { label: 'Bluetooth', value: 'Version 5.2' },
          { label: 'Multipoint', value: 'Yes — two devices connected at once' },
          { label: 'Wired listening', value: '3.5 mm jack (cable included)' },
        ],
      },
      {
        group: 'Physical',
        rows: [
          { label: 'Weight', value: 'Approx. 250 g (8.82 oz)' },
          { label: 'Water resistance', value: 'None — the headset is not waterproof' },
          { label: 'In the box', value: 'Carrying case, headphone cable and USB charging cable' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Not waterproof — Sony warns that charging it while wet with rain or sweat can cause a malfunction.',
          'It cannot play, pair or power on while charging; starting a charge switches it off.',
          'No folding step is documented, so it travels in its case rather than a pocket.',
          'Noise canceling works on low-frequency noise and is documented as less effective for voices.',
        ],
      },
    ],
  },
}

/**
 * Every slug that has a Quick Look page. Derived from QUICK_LOOK itself, so a
 * standalone entry (which has no catalog record to be filtered by) is included
 * automatically. Entries appear in the order they are declared.
 */
export const QUICK_LOOK_SLUGS: string[] = Object.keys(QUICK_LOOK)

/** Canonical href for a Quick Look page. */
export const quickLookHref = (slug: string): string => `/quick-look/${slug}`

export function getQuickLookEntry(slug: string): QuickLookEntry | undefined {
  return QUICK_LOOK[slug]
}

/** A resolved Quick Look page: its entry plus the product it renders. */
export interface QuickLookView {
  entry: QuickLookEntry
  /** The catalog record, or the Product-shaped view built from a standalone entry. */
  product: Product
  /** True when the entry carried its own product facts instead of joining a record. */
  standalone: boolean
}

/**
 * The product facts a Quick Look page renders, from whichever source it uses:
 * the catalog record when the slug has one, otherwise the entry's own `product`
 * fields, mapped onto the Product shape every component already accepts.
 *
 * Returns undefined when the slug has no entry at all, or when it is standalone
 * with no `product` block — the route turns that into a 404 rather than
 * rendering a page around missing data.
 */
export function resolveQuickLook(slug: string): QuickLookView | undefined {
  const entry = QUICK_LOOK[slug]
  if (!entry) return undefined

  const record = PRODUCTS.find((product) => product.slug === slug)
  if (record) return { entry, product: record, standalone: false }

  const own = entry.product
  if (!own) return undefined

  const images = getQuickLookImages(entry)

  return {
    entry,
    standalone: true,
    product: {
      id: `ql-${slug}`,
      slug,
      name: own.name,
      category: own.category,
      categorySlug: own.categorySlug,
      // No price is carried without a check date, so the page cannot show a
      // stale number: datedPrice() returns null and the buy button states
      // where the price lives (see src/lib/site.ts).
      price: own.priceCheckedOn ? (own.price ?? null) : null,
      ...(own.oldPrice != null ? { oldPrice: own.oldPrice } : {}),
      image: own.image ?? '📦',
      ...(images[0] ? { imageUrl: images[0] } : {}),
      // Amazon's own figures. RatingStars labels them as Amazon's; an entry
      // that has none renders no rating row at all.
      rating: own.rating ?? null,
      reviews: own.reviews ?? 0,
      description: own.description,
      features: own.features,
      buyUrl: own.buyUrl,
      ...(own.altText ? { altText: own.altText } : {}),
      ...(own.metaTitle ? { metaTitle: own.metaTitle } : {}),
      ...(own.metaDescription ? { metaDescription: own.metaDescription } : {}),
      ...(own.primaryKeyword ? { primaryKeyword: own.primaryKeyword } : {}),
      ...(own.secondaryKeywords ? { secondaryKeywords: own.secondaryKeywords } : {}),
    },
  }
}

/**
 * The product behind a Quick Look entry — the catalog record when there is one,
 * otherwise the standalone entry's own facts. Undefined means no page.
 */
export function getQuickLookProduct(slug: string): Product | undefined {
  return resolveQuickLook(slug)?.product
}

/**
 * Gallery images for a Quick Look page. A linked entry puts the record's own
 * photo first and then its extras; a standalone entry simply lists its copied
 * images here (its record has no photo). Only paths that look like real files
 * under public/product-images are returned.
 */
export function getQuickLookImages(entry: QuickLookEntry): string[] {
  const product = PRODUCTS.find((p) => p.slug === entry.slug)
  const all = [product?.imageUrl, ...(entry.images ?? [])]
  return all.filter(
    (image): image is string =>
      typeof image === 'string' && image.startsWith('/product-images/'),
  )
}

/**
 * Snapshot of every Quick Look page for the listing grid, in declaration
 * order: linked and standalone entries alike, each with its resolved product.
 */
export function getQuickLookCatalog(): QuickLookView[] {
  return QUICK_LOOK_SLUGS.flatMap((slug) => {
    const view = resolveQuickLook(slug)
    return view ? [view] : []
  })
}
