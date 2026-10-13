import { PRODUCTS } from './products'
import type { Product } from './products'

/**
 * Quick Look data layer.
 *
 * A Quick Look page is a spec-sheet view of a product that is ALREADY in the
 * GadgetErea catalog (`src/data/products.ts`). Nothing here duplicates a
 * product record: each entry links to it by `slug` and adds only what the
 * catalog does not carry — the grouped spec table, the verified-spec source
 * notes and the Quick Look status flags.
 *
 * RULES (standing rules — see memory.md):
 * - Specs are grouped by category and keyed by the product's slug. Every value
 *   must come from the product's own listing data or a named manufacturer /
 *   retailer source recorded in `specSource`. Never guess a number, a rating
 *   or a warranty term: a missing value stays out of the table.
 * - No price is stored here. Amazon prices change constantly, so the UI shows
 *   the call to action instead (see src/lib/site.ts). If a price is ever added
 *   it must ship with `priceCheckedOn` and be displayed as "as of <date>".
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
  rows: QuickLookSpecRow[]
}

export interface QuickLookOption {
  label: string
  /** Short, factual note about the option — never a price. */
  note?: string
}

export interface QuickLookEntry {
  /** Product slug from src/data/products.ts. The join key — must exist. */
  slug: string
  status: QuickLookStatus
  /** Grouped spec table, rendered in order. */
  specs: QuickLookSpecGroup[]
  /**
   * Purchasable option dimension (colour, bundle, capacity) when the product
   * really has one and the labels are verified. Left unset when unverified.
   */
  options?: QuickLookOption[]
  /**
   * Extra gallery images beyond the product's own `imageUrl`. Only real files
   * that exist in `public/product-images/` may be listed.
   */
  images?: string[]
  /**
   * Short, human product name used for the H1 and meta title — the brand plus
   * the model exactly as the listing spells them, without the listing's
   * marketing tail. Full catalog `name` stays the source for cards and schema.
   */
  displayName: string
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
      "Sony's WH-1000XM5 specification sheet and help guide, plus the product's Amazon listing data",
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
    ],
  },
}

/** Every product slug that has a Quick Look page, in catalog order. */
export const QUICK_LOOK_SLUGS: string[] = PRODUCTS.map((p) => p.slug).filter(
  (slug) => slug in QUICK_LOOK,
)

/** Canonical href for a Quick Look page. */
export const quickLookHref = (slug: string): string => `/quick-look/${slug}`

export function getQuickLookEntry(slug: string): QuickLookEntry | undefined {
  return QUICK_LOOK[slug]
}

/**
 * The catalog product behind a Quick Look entry. Returns undefined when the
 * slug has no entry OR no catalog product, so callers can 404 instead of
 * rendering a page around missing data.
 */
export function getQuickLookProduct(slug: string): Product | undefined {
  if (!(slug in QUICK_LOOK)) return undefined
  return PRODUCTS.find((product) => product.slug === slug)
}

/**
 * Gallery images for a Quick Look page: the product's own photo first, then any
 * extra images listed in the entry. Only paths that look like real files under
 * public/product-images are returned.
 */
export function getQuickLookImages(entry: QuickLookEntry): string[] {
  const product = PRODUCTS.find((p) => p.slug === entry.slug)
  const all = [product?.imageUrl, ...(entry.images ?? [])]
  return all.filter(
    (image): image is string =>
      typeof image === 'string' && image.startsWith('/product-images/'),
  )
}

/** Snapshot of every Quick Look entry with its catalog product attached. */
export function getQuickLookCatalog(): { entry: QuickLookEntry; product: Product }[] {
  return QUICK_LOOK_SLUGS.flatMap((slug) => {
    const entry = QUICK_LOOK[slug]
    const product = getQuickLookProduct(slug)
    return entry && product ? [{ entry, product }] : []
  })
}
