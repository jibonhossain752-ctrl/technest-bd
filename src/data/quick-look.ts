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
 * An entry may also be INFORMATIONAL (`informational: true`): a page that
 * carries no purchase path at all — no outbound store link, no affiliate
 * disclosure. It is the one shape that can show a price: its `priceBox` carries
 * a manufacturer's own announced figure with a source and a date (memory.md
 * rule 3), which is only allowed because there is no Amazon link beside it.
 * Only manufacturer announcements that this store does not sell belong here,
 * and such an entry must NOT carry a `buyUrl`.
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
 * - One price surface only: `priceBox`, a manually entered manufacturer /
 *   official price that ships with its `source` and `asOf` date (memory.md rule
 *   3). A page that carries `priceBox` must carry NO Amazon link — Amazon only
 *   allows an Amazon-served price (Creators/PA API with a timestamp), so a
 *   manual figure can never sit beside a buy button. Catalog prices stay off
 *   this surface: they have no verified date, so the UI shows the call to
 *   action instead (see src/lib/site.ts).
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
  /**
   * Optional: this option is not offered while another dimension is set to one
   * of `options` (HomeView: Starlight and Rose Pink exist only on the tabletop
   * model). The chip then renders greyed out, disabled and `aria-disabled`, and
   * the selector moves the selection to the first option in this group that is
   * still available. Leave it unset where every combination exists.
   */
  disabledWhen?: { group: string; options: string[] }
}

/**
 * A variant dimension the product really has (model version, colour, bundle).
 * Rendered as the detail page's option chips. Informational only: a selection
 * never changes the price box, whose figures are the manufacturer's published
 * ones.
 */
export interface QuickLookVariant {
  label: string
  options: QuickLookOption[]
  /**
   * Optional caption under this dimension's chips, used instead of the selected
   * option's `note`. For a page whose options depend on another dimension
   * (HomeView's colours), one per-option note cannot describe every combination
   * truthfully; this one sentence can.
   */
  note?: string
}

/**
 * One row of a price box's optional table — a configuration and what it costs
 * (`label` names the setup, `amount` is the display string, `note` is an
 * optional short caveat such as "no mount needed").
 */
export interface QuickLookPriceRow {
  label: string
  amount: string
  note?: string
}

/**
 * A page's one price, typed in by hand by the owner.
 *
 * The figure is hand-entered and may be out of date; `asOf` says when it was
 * typed in and `source` says who supplied it. A page may carry a `priceBox`
 * and an Amazon buy link together — owner decision on 2026-10-21 (see the guard
 * in scripts/check-quick-look.js), which supersedes the earlier rule that the
 * two could not coexist.
 *
 * Either give one headline `amount`, or leave `amount` out and price each
 * variant in `rows` (then `label` is the neutral heading, e.g. "Prices by
 * storage capacity").
 */
export interface QuickLookPriceBox {
  /**
   * The headline: what the amount is (e.g. "Apple's announced US launch
   * price"), or, on a page priced per variant, a neutral heading such as
   * "Prices by storage capacity". Rendered large when `amount` is absent.
   */
  label: string
  /**
   * The single headline figure, e.g. "$299". Omit it on a page priced per
   * variant; each variant's price then lives in `rows`.
   */
  amount?: string
  /** ISO date the figure was read from the source. Rendered as "as of <date>". */
  asOf: string
  /** Where the figure came from, e.g. "Apple Newsroom, October 13, 2026". */
  source: string
  /** Optional caveat under the table (tax, excluded accessories, regions). */
  note?: string
  /** Optional table: full-setup costs across configurations. */
  rows?: QuickLookPriceRow[]
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
  /**
   * The product's own affiliate link — the page's buy button. Required on every
   * standalone entry EXCEPT an `informational` one, which has no purchase path
   * and must leave this unset (the guard fails the build on either mismatch).
   */
  buyUrl?: string
  /** One-sentence description, used as the page lede and the card copy. */
  description: string
  /** Short scan-first lines, rendered as the page's highlight list. */
  features: string[]
  /** Manufacturer brand for the Product schema. Falls back to the name's first word. */
  brand?: string
  /**
   * ISO date this page's content was written. A standalone entry has no catalog
   * record to carry one, so it supplies its own; `resolveQuickLook` passes it
   * through and the sitemap reads it as the page's `lastmod`.
   */
  addedAt?: string
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
  /**
   * Optional gallery mapping for a page whose variants really have their own
   * picture: the key is the selected option label from each dimension in
   * `variants` order, joined with " + " ("HomeView (Wall Mounted) + Space Gray"),
   * and the value is an image already listed in `images`. A page that leaves it
   * out behaves exactly as before — selecting a chip changes nothing.
   */
  variantImages?: Record<string, string>
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
   * Set on a page that carries NO purchase path: the detail page renders no
   * purchase panel at all (no store button, no price note, no affiliate
   * disclosure) and the entry carries no `buyUrl`. Use it only for a product
   * this store does not sell — a manufacturer announcement whose only real
   * facts are specifications and an announced price.
   */
  informational?: boolean
  /**
   * The one line under the gallery on an informational page, saying the images
   * are illustrations rather than photographs. It lives in the data because the
   * sentence has to name the right manufacturer and date: HomeView's runs from
   * Apple's announcement, which would be false on any other page. An
   * informational entry without it renders no note at all.
   */
  illustrationNote?: string
  /**
   * The page's one price, when the owner has typed one in from a dated
   * manufacturer / official source. Its presence is what makes the page's
   * price box show a figure, and it forbids any Amazon link on that page (see
   * QuickLookPriceBox and memory.md rule 3). Omit it and the box reads "No
   * price listed".
   */
  priceBox?: QuickLookPriceBox
  /**
   * Hand-written alt text, position-matched to `images` (index 0 is the first
   * gallery image, which is also the card and og:image). Written while looking
   * at each file, so it always wins over the generated fallback — same rule as
   * a post's `altText` or an in-body image's `alt` (src/lib/imageAlt.ts). The
   * guard fails the build when the array length does not match the gallery.
   */
  imageAlts?: string[]
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
   * Optional hand-written meta title, used instead of the generated
   * "{displayName} Specs & Buying Guide" pattern when the page covers a subject
   * the pattern misses (for example dimensions on a product people search by
   * size). Same 60-character ceiling as the generated title.
   */
  metaTitle?: string
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
    // Prices entered by hand by the owner on 2026-10-21; not fetched from any API.
    priceBox: {
      label: 'Owner-entered price',
      amount: '$199.99',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
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

  // ── Standalone entries ────────────────────────────────────────────────────
  // None of these products is in src/data/products.ts: they get no shop card
  // and no /product page, only the spec sheet below. Every fact in a `product`
  // block comes from the manufacturer's own pages (see `specSource` on each
  // entry). No price and no rating is stored on any of them, so their pages
  // render the Amazon button alone — nothing is ever estimated or hardcoded.
  'apple-airpods-pro-3': {
    slug: 'apple-airpods-pro-3',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$126',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'Apple AirPods Pro 3',
    status: 'available',
    product: {
      name: 'Apple AirPods Pro 3',
      category: 'Audio & Wearables',
      categorySlug: 'audio-wearables',
      buyUrl: 'https://amzn.to/4hMbPrN',
      brand: 'Apple',
      description:
        "Apple's third-generation in-ear earbuds: the H2 chip, active noise cancellation, hearing health tools, heart-rate sensing for workouts and an IP57 rating on both the earbuds and the charging case.",
      features: [
        'Apple H2 headphone chip with Adaptive Audio',
        "Apple claims up to twice the noise reduction of AirPods Pro 2",
        'Hearing Test, Hearing Aid and Hearing Protection built in',
        'Heart-rate sensor for workouts',
        'IP57 dust, sweat and water resistance on the earbuds and the case',
      ],
    },
    // Apple's AirPods Pro 3 technical specifications page, the AirPods Pro 3
    // newsroom announcement (noise-cancellation multiples, heart-rate sensing)
    // and Apple's support guidance on dust, sweat and water resistance.
    specSource:
      "Apple's AirPods Pro 3 technical specifications page and hearing-health page, Apple's AirPods Pro 3 newsroom announcement, and Apple's published guidance on dust, sweat and water resistance — all checked against Apple's own pages in October 2026",
    metaDescription:
      "AirPods Pro 3 spec sheet: the H2 chip, Apple's noise-cancellation claims, hearing health tools, heart-rate sensing and an IP57 rating for earbuds and case.",
    images: [
      '/product-images/apple-airpods-pro-3-earbuds-charging-case.webp',
      '/product-images/apple-airpods-pro-3-retail-box.webp',
      '/product-images/apple-airpods-pro-3-paired-with-iphone.webp',
    ],
    highlights: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Noise cancellation', value: 'Up to 2x AirPods Pro 2' },
      { label: 'Listening', value: 'Up to 8 h' },
      { label: 'With case', value: 'Up to 24 h' },
      { label: 'Resistance', value: 'IP57' },
    ],
    keySpecs: [
      { label: 'Chip', value: 'Apple H2 headphone chip' },
      { label: 'Noise cancellation', value: 'Apple claims up to 2x more than AirPods Pro 2' },
      { label: 'Listening time', value: 'Up to 8 hours with noise cancellation on' },
      { label: 'With the charging case', value: 'Up to 24 hours of listening' },
      { label: 'Dust, sweat and water', value: 'IP57 on the earbuds and the charging case' },
      { label: 'Bluetooth', value: 'Version 5.3' },
      {
        label: 'Charging case',
        value: 'USB-C MagSafe case with a speaker and a lanyard loop',
      },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Apple' },
      { label: 'Model', value: 'AirPods Pro 3' },
      { label: 'Weight, each earbud', value: '5.55 g (0.20 oz)' },
      { label: 'Weight, charging case', value: '43.99 g (1.55 oz)' },
      { label: 'Ear tips', value: 'Five sizes: XXS, XS, S, M and L' },
      {
        label: 'In the box',
        value:
          'AirPods Pro 3, the USB-C MagSafe charging case and five ear-tip sizes — Apple lists the USB-C cable as sold separately',
      },
      { label: 'Heart-rate sensor', value: 'Built in, for workouts' },
    ],
    specs: [
      {
        group: 'Audio and chip',
        rows: [
          { label: 'Chip', value: 'Apple H2 headphone chip' },
          { label: 'Driver', value: 'Custom high-excursion Apple driver' },
          { label: 'Amplifier', value: 'Custom high dynamic range amplifier' },
          { label: 'Acoustic architecture', value: 'Multiport' },
          { label: 'Adaptive EQ', value: 'Yes' },
          { label: 'Personalized Volume', value: 'Yes' },
          {
            label: 'Spatial audio',
            value: 'Personalized Spatial Audio with dynamic head tracking',
          },
        ],
      },
      {
        group: 'Noise control',
        rows: [
          {
            label: 'Active Noise Cancellation',
            value: 'Apple claims up to 2x more noise reduction than AirPods Pro 2',
          },
          { label: 'Transparency mode', value: 'Yes' },
          { label: 'Adaptive Audio', value: 'Yes' },
          { label: 'Conversation Awareness', value: 'Yes' },
          { label: 'Loud Sound Reduction', value: 'Yes' },
          { label: 'Voice Isolation', value: 'Yes' },
        ],
      },
      {
        group: 'Hearing health',
        rows: [
          { label: 'Hearing Test', value: 'Yes' },
          { label: 'Hearing Aid', value: 'Yes' },
          { label: 'Hearing Protection', value: 'Yes' },
          {
            label: 'Availability',
            value: 'Apple notes that feature availability can vary by region',
          },
        ],
      },
      {
        group: 'Sensors and fitness',
        rows: [
          { label: 'Heart-rate sensor', value: 'Built in' },
          {
            label: 'Workout support',
            value: 'Apple lists heart rate and calories across up to 50 workout types in the Fitness app',
          },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Listening, noise cancellation on', value: 'Up to 8 hours' },
          {
            label: 'Listening, spatial audio with head tracking',
            value: 'Up to 7.5 hours',
          },
          {
            label: 'Workouts with heart-rate sensing',
            value: 'Up to 6.5 hours',
          },
          {
            label: 'Transparency mode with Hearing Aid',
            value: 'Up to 10 hours',
          },
          { label: 'Total with the charging case', value: 'Up to 24 hours' },
          { label: 'Quick charge', value: 'Five minutes in the case for around an hour of listening' },
          {
            label: 'Charging',
            value: 'USB-C, MagSafe, an Apple Watch charger or a Qi-certified charger',
          },
        ],
      },
      {
        group: 'Connectivity',
        rows: [
          { label: 'Bluetooth', value: 'Version 5.3' },
          {
            label: 'Live Translation',
            value:
              'Requires an Apple Intelligence-enabled iPhone running iOS 26 or later, per Apple',
          },
          {
            label: 'Paired devices',
            value: 'iPhone, iPad, Apple Watch, Mac, Apple TV and Apple Vision Pro',
          },
        ],
      },
      {
        group: 'Fit and build',
        rows: [
          { label: 'Ear tips', value: 'Five sizes: XXS, XS, S, M and L' },
          { label: 'Dust, sweat and water resistance', value: 'IP57 on the earbuds and the case' },
          {
            label: 'What IP57 means to Apple',
            value: 'Up to 1 metre of water for up to 30 minutes, and not for swimming or showering',
          },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Apple states the earbuds are not waterproof or sweatproof, that resistance is not permanent, and that they should not be charged while wet.',
          'The USB-C charge cable is listed as sold separately.',
          'Live Translation needs a compatible Apple Intelligence iPhone, and the hearing features vary by region — both per Apple.',
          "Battery hours are Apple's own ratings under set conditions rather than independent measurements.",
        ],
      },
    ],
  },

  'dji-osmo-action-5-pro': {
    slug: 'dji-osmo-action-5-pro',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$229.00',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'DJI Osmo Action 5 Pro',
    status: 'available',
    product: {
      name: 'DJI Osmo Action 5 Pro',
      category: 'Cameras',
      categorySlug: 'cameras',
      buyUrl: 'https://amzn.to/4ymihL0',
      brand: 'DJI',
      description:
        'A mount-anywhere action camera with a 1/1.3-inch sensor, 4K recording at up to 120 fps, RockSteady stabilisation, 47 GB of built-in storage and a 20 m depth rating without a housing.',
      features: [
        '1/1.3-inch CMOS sensor with up to 40 MP stills',
        '4K video at up to 120 fps',
        'RockSteady 3.0, RockSteady 3.0+, HorizonBalancing and HorizonSteady',
        '64 GB of built-in storage with 47 GB available, plus microSD up to 1 TB',
        'Waterproof to 20 m without a case, 60 m with the waterproof case',
      ],
    },
    // DJI's official Osmo Action 5 Pro specifications table and DJI's own FAQ
    // and support pages for the model (stabilisation limits, cold-weather
    // runtime, the 30 W charger note and the missing charging time).
    specSource:
      "DJI's Osmo Action 5 Pro specifications table and DJI's official Osmo Action 5 Pro product and FAQ pages — all checked against DJI's own pages in October 2026",
    metaDescription:
      'DJI Osmo Action 5 Pro spec sheet: a 1/1.3-inch sensor, 4K at up to 120 fps, RockSteady stabilisation, 47 GB of built-in storage and a 20 m depth rating.',
    images: [
      '/product-images/dji-osmo-action-5-pro-two-cameras.webp',
      '/product-images/dji-osmo-action-5-pro-battery-case.webp',
      '/product-images/dji-osmo-action-5-pro-handlebar-mount.webp',
      '/product-images/dji-osmo-action-5-pro-selfie-stick-kit.webp',
    ],
    highlights: [
      { label: 'Sensor', value: '1/1.3-inch CMOS' },
      { label: 'Video', value: '4K up to 120 fps' },
      { label: 'Stabilisation', value: 'RockSteady 3.0' },
      { label: 'Storage', value: '47 GB built in' },
      { label: 'Water', value: 'To 20 m' },
    ],
    keySpecs: [
      { label: 'Sensor', value: '1/1.3-inch CMOS' },
      { label: 'Photos', value: 'Up to 40 MP (7296 x 5472)' },
      { label: 'Video', value: '4K at up to 120 fps' },
      {
        label: 'Stabilisation',
        value: 'RockSteady 3.0, RockSteady 3.0+, HorizonBalancing and HorizonSteady',
      },
      { label: 'Screens', value: 'Two OLED touchscreens: 1.46-inch front, 2.5-inch rear' },
      { label: 'Battery', value: '1950 mAh, up to 240 minutes of recording per DJI' },
      { label: 'Water resistance', value: 'To 20 m without a case, 60 m with the waterproof case' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'DJI' },
      { label: 'Model', value: 'Osmo Action 5 Pro' },
      { label: 'Weight', value: '146 g' },
      { label: 'Dimensions', value: '70.5 x 44.2 x 32.8 mm' },
      { label: 'Built-in storage', value: '64 GB total, 47 GB available to use' },
      { label: 'Expandable storage', value: 'microSD cards up to 1 TB' },
      { label: 'Operating temperature', value: '-20 C to 45 C' },
      {
        label: 'Mounting',
        value: "DJI's quick-release locking clips, with an adapter mount for third-party accessories",
      },
    ],
    specs: [
      {
        group: 'Camera',
        rows: [
          { label: 'Sensor', value: '1/1.3-inch CMOS' },
          { label: 'Maximum photo size', value: '7296 x 5472 pixels, around 40 MP' },
          { label: 'Field of view', value: '155 degrees' },
          { label: 'Aperture', value: 'f/2.8' },
          { label: 'Focus range', value: '0.35 m to infinity' },
          { label: 'ISO range, photo', value: '100 to 25,600' },
          { label: 'ISO range, video', value: '100 to 51,200' },
          { label: 'Photo formats', value: 'JPEG and RAW' },
        ],
      },
      {
        group: 'Video',
        rows: [
          { label: '4K (16:9)', value: '24 to 60 fps, plus 100 and 120 fps' },
          { label: '4K (4:3)', value: '24 to 60 fps, plus 100 and 120 fps' },
          { label: '2.7K (16:9)', value: '24 to 60 fps, plus 100 and 120 fps' },
          { label: '1080p (16:9)', value: '24 to 60 fps, plus 100, 120, 200 and 240 fps' },
          {
            label: 'Slow motion',
            value: '4K at 120 fps (4x), 2.7K at 120 fps (4x) and 1080p at 240 fps (8x)',
          },
          { label: 'Colour', value: '10-bit, D-Log M and HLG' },
          { label: 'Maximum bitrate', value: '120 Mbps' },
          { label: 'Format', value: 'MP4 (HEVC)' },
        ],
      },
      {
        group: 'Stabilisation',
        rows: [
          { label: 'RockSteady 3.0', value: 'Yes' },
          { label: 'RockSteady 3.0+', value: 'Yes' },
          {
            label: 'HorizonBalancing',
            value: '1080p, 2.7K or 4K (16:9) at 60 fps or below',
          },
          { label: 'HorizonSteady', value: '1080p or 2.7K (16:9) at 60 fps or below' },
          {
            label: 'Where it does not apply',
            value: "DJI states electronic stabilisation is not supported in Timelapse or Slow Motion",
          },
        ],
      },
      {
        group: 'Storage and audio',
        rows: [
          { label: 'Built-in storage', value: '64 GB total with 47 GB available for use' },
          { label: 'microSD', value: 'Cards up to 1 TB' },
          { label: 'Microphones', value: 'Three built in' },
          { label: 'Audio recording', value: '48 kHz, 16-bit AAC' },
        ],
      },
      {
        group: 'Screens',
        rows: [
          {
            label: 'Front',
            value: '1.46-inch OLED touchscreen, 342 x 342, 800 cd/m2 typical brightness',
          },
          {
            label: 'Rear',
            value:
              '2.5-inch OLED touchscreen, 400 x 712, 800 cd/m2 typical and 1000 cd/m2 peak brightness',
          },
        ],
      },
      {
        group: 'Battery and power',
        rows: [
          { label: 'Battery', value: '1950 mAh, 7.5 Wh, 3.87 V' },
          {
            label: 'Recording time',
            value:
              "Up to 240 minutes per DJI, measured at 25 C recording 1080p/24 with RockSteady on and the screens and Wi-Fi off",
          },
          {
            label: 'Cold weather',
            value: 'Up to 3.6 hours at -20 C in DJI laboratory conditions',
          },
          { label: 'Operating temperature', value: '-20 C to 45 C' },
          { label: 'Charging temperature', value: '5 C to 40 C' },
          {
            label: 'Charger',
            value: 'DJI states a 30 W USB-C charger is supported, sold separately',
          },
        ],
      },
      {
        group: 'Ruggedness and body',
        rows: [
          { label: 'Water resistance', value: 'To 20 m without a case, 60 m with the waterproof case' },
          { label: 'IP rating', value: 'IP68 for the camera and the case, per DJI' },
          { label: 'Dimensions', value: '70.5 x 44.2 x 32.8 mm' },
          { label: 'Weight', value: '146 g' },
          {
            label: 'Mounting',
            value: 'Quick-release locking clips and a magnetic ball-joint adapter mount',
          },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'DJI does not state a charging time on its specifications or FAQ pages, so none is listed here.',
          'Electronic stabilisation is not supported in Timelapse or Slow Motion, per DJI.',
          'HorizonSteady and HorizonBalancing stop at 60 fps, and HorizonSteady at 1080p or 2.7K (16:9).',
          'DJI warns against hot springs, extreme underwater environments and corrosive liquids.',
          'The runtime and cold-weather figures are DJI laboratory measurements rather than independent results.',
        ],
      },
    ],
  },

  'samsung-galaxy-tab-s10-ultra': {
    slug: 'samsung-galaxy-tab-s10-ultra',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$1,099.99',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'Samsung Galaxy Tab S10 Ultra',
    status: 'available',
    product: {
      name: 'Samsung Galaxy Tab S10 Ultra',
      category: 'Laptops & PCs',
      categorySlug: 'laptops',
      buyUrl: 'https://amzn.to/3VPbN9Z',
      brand: 'Samsung',
      description:
        "Samsung's 14.6-inch tablet with a 120 Hz Dynamic AMOLED 2X display, up to 16 GB of memory, an S Pen in the box, an 11,200 mAh battery and IP68 water and dust resistance.",
      features: [
        '14.6-inch Dynamic AMOLED 2X display at 120 Hz',
        'Up to 16 GB of RAM and 1 TB of storage',
        'S Pen included in the box',
        '11,200 mAh battery with 45 W Super Fast Charging support',
        'IP68 water and dust resistance',
      ],
    },
    // Samsung's US Galaxy Tab S10 pages and the US support article for the
    // model, with dimensions, weight and materials from Samsung's own official
    // product specification page for the Wi-Fi model. Samsung's US pages for
    // this tablet do not state the processor, so the sheet carries no chip row.
    specSource:
      "Samsung's US Galaxy Tab S10 series pages and US support article for the Galaxy Tab S10 Ultra, together with Samsung's own official product specification page for the Wi-Fi model (dimensions, weight and materials) — all checked against Samsung's pages in October 2026",
    metaDescription:
      'Galaxy Tab S10 Ultra spec sheet: a 14.6-inch 120 Hz AMOLED display, up to 16 GB of memory, the S Pen in the box, IP68 protection and an 11,200 mAh battery.',
    images: [
      '/product-images/samsung-galaxy-tab-s10-ultra-angled-view.webp',
      '/product-images/samsung-galaxy-tab-s10-ultra-desk-setup.webp',
    ],
    highlights: [
      { label: 'Display', value: '14.6-inch AMOLED' },
      { label: 'Refresh rate', value: '120 Hz' },
      { label: 'Memory', value: 'Up to 16 GB' },
      { label: 'Battery', value: '11,200 mAh' },
      { label: 'Resistance', value: 'IP68' },
    ],
    keySpecs: [
      { label: 'Display', value: '14.6-inch Dynamic AMOLED 2X, 2960 x 1848' },
      { label: 'Refresh rate', value: 'Up to 120 Hz' },
      { label: 'Memory and storage', value: 'Up to 16 GB of RAM; 256 GB, 512 GB or 1 TB' },
      { label: 'Expandable storage', value: 'microSD cards up to 1.5 TB' },
      { label: 'Battery', value: '11,200 mAh, up to 16 hours of video playback per Samsung' },
      { label: 'Charging', value: '45 W Super Fast Charging support, charger sold separately' },
      { label: 'S Pen', value: 'Included in the box' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Samsung' },
      { label: 'Model', value: 'Galaxy Tab S10 Ultra' },
      { label: 'Frame', value: 'Enhanced Armor Aluminum' },
      { label: 'Thickness', value: '5.4 mm' },
      { label: 'Weight', value: '718 g for the Wi-Fi model' },
      { label: 'Rear cameras', value: '13 MP wide and 8 MP ultra wide' },
      { label: 'Front cameras', value: '12 MP wide and 12 MP ultra wide' },
      { label: 'Speakers', value: 'Quad speakers with Dolby Atmos' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '14.6 inches across the full rectangle, 14.5 inches with rounded corners' },
          { label: 'Panel', value: 'Dynamic AMOLED 2X' },
          { label: 'Resolution', value: '2960 x 1848 (WQXGA+)' },
          { label: 'Refresh rate', value: 'Up to 120 Hz' },
          { label: 'Coating', value: 'Anti-reflection treatment' },
        ],
      },
      {
        group: 'Memory and storage',
        rows: [
          { label: 'Memory', value: 'Up to 16 GB of RAM' },
          { label: 'Storage', value: '256 GB, 512 GB or 1 TB' },
          { label: 'microSD', value: 'Cards up to 1.5 TB, sold separately' },
          {
            label: 'Not published by Samsung US',
            value: 'The processor is not named on the US pages for this model, so no chip row is listed',
          },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Capacity', value: '11,200 mAh typical' },
          {
            label: 'Video playback',
            value: "Up to 16 hours, Samsung's own 720p local-playback measurement",
          },
          { label: 'Charging', value: '45 W Super Fast Charging support' },
          { label: 'Charger', value: 'Sold separately, per Samsung' },
        ],
      },
      {
        group: 'Cameras and audio',
        rows: [
          { label: 'Rear camera', value: '13 MP wide and 8 MP ultra wide' },
          { label: 'Front camera', value: '12 MP wide and 12 MP ultra wide' },
          { label: 'Speakers', value: 'Quad speakers with Dolby Atmos' },
        ],
      },
      {
        group: 'Build and durability',
        rows: [
          { label: 'Frame', value: 'Enhanced Armor Aluminum' },
          { label: 'Water and dust resistance', value: 'IP68' },
          {
            label: 'What Samsung says IP68 covers',
            value: 'Up to 5 feet of water for up to 30 minutes, with the device rinsed and dried afterwards',
          },
          { label: 'S Pen resistance', value: 'IP68 rated, per Samsung' },
          { label: 'Thickness', value: '5.4 mm' },
          { label: 'Weight', value: '718 g for the Wi-Fi model' },
        ],
      },
      {
        group: 'S Pen and Galaxy AI',
        rows: [
          { label: 'S Pen', value: 'Included with the tablet' },
          { label: 'Circle to Search', value: 'Yes' },
          { label: 'Note Assist', value: 'Yes, including transcription, organising and summarising notes' },
          { label: 'Sketch to Image', value: 'Yes' },
          { label: 'Transcript assist', value: 'Yes, in Samsung Notes' },
          { label: 'Gallery tools', value: 'Portrait Studio, Live Effects and Instant Slow-mo' },
          { label: 'Translation', value: 'Website and PDF text translation' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Samsung does not publish the processor name on the US pages for this model, so the chip is left out rather than guessed.',
          'The US pages reviewed state no operating-system version and no operating-system upgrade promise for the Tab S10 Ultra.',
          'The 45 W charger is sold separately.',
          'Video playback time is Samsung\u2019s own laboratory figure for local 720p playback rather than an independent measurement.',
          'Samsung advises that water resistance is not permanent and can be reduced by damage or wear.',
        ],
      },
    ],
  },

  'samsung-galaxy-s26-ultra': {
    slug: 'samsung-galaxy-s26-ultra',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$1,598.99',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'Samsung Galaxy S26 Ultra',
    status: 'available',
    product: {
      name: 'Samsung Galaxy S26 Ultra',
      category: 'Smartphones',
      categorySlug: 'smartphones',
      buyUrl: 'https://amzn.to/4BmbqnM',
      brand: 'Samsung',
      description:
        "Samsung's flagship phone with a 6.9-inch QHD+ display and a built-in Privacy Display, a 200 MP main camera, the Snapdragon 8 Elite Gen 5 for Galaxy and a 5,000 mAh battery with up to 60 W charging.",
      features: [
        '6.9-inch QHD+ Dynamic AMOLED 2X display with a Privacy Display',
        '200 MP main camera with a 50 MP ultra wide and a quad telephoto system',
        'Snapdragon 8 Elite Gen 5 for Galaxy',
        '5,000 mAh battery with up to 60 W wired charging',
        'S Pen included, with IP68 water and dust resistance',
      ],
    },
    // Samsung's US Galaxy S26 Ultra comparison pages and support articles for
    // memory and storage, cameras, battery and charging, the IP rating and the
    // S Pen, plus the US purchase page for the model. Samsung's US pages do not
    // publish the weight, so no weight row is listed.
    specSource:
      "Samsung's US Galaxy S26 Ultra comparison and purchase pages and Samsung's US support articles for memory and storage, camera, battery and charging, IP rating and S Pen — all checked against Samsung's own pages in October 2026",
    metaDescription:
      'Galaxy S26 Ultra spec sheet: a 6.9-inch QHD+ display with a Privacy Display, a 200 MP main camera, the Snapdragon 8 Elite Gen 5 and a 5,000 mAh battery.',
    images: [
      '/product-images/samsung-galaxy-s26-ultra-with-s-pen.webp',
      '/product-images/samsung-galaxy-s26-ultra-galaxy-ai.webp',
      '/product-images/samsung-galaxy-s26-ultra-camera-detail.webp',
      '/product-images/samsung-galaxy-s26-ultra-side-profile.webp',
    ],
    highlights: [
      { label: 'Display', value: '6.9-inch QHD+' },
      { label: 'Main camera', value: '200 MP' },
      { label: 'Processor', value: 'Snapdragon 8 Elite Gen 5' },
      { label: 'Battery', value: '5,000 mAh' },
      { label: 'Charging', value: 'Up to 60 W' },
    ],
    keySpecs: [
      { label: 'Display', value: '6.9-inch Dynamic AMOLED 2X at QHD+' },
      { label: 'Refresh rate', value: 'Up to 120 Hz, adaptive' },
      { label: 'Processor', value: 'Snapdragon 8 Elite Gen 5 for Galaxy' },
      {
        label: 'Rear cameras',
        value: '200 MP wide, 50 MP ultra wide and a 50 MP + 10 MP quad telephoto system',
      },
      { label: 'Front camera', value: '12 MP' },
      { label: 'Battery', value: '5,000 mAh' },
      { label: 'Charging', value: 'Up to 60 W wired and up to 25 W wireless, with Wireless PowerShare' },
      { label: 'Durability', value: 'IP68, with an Armor Aluminum frame and Gorilla Armor 2' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Samsung' },
      { label: 'Model', value: 'Galaxy S26 Ultra' },
      { label: 'Memory and storage', value: '12 GB with 256 GB or 512 GB; 16 GB with 1 TB' },
      { label: 'S Pen', value: 'Included; Samsung states it does not support Bluetooth or Air Actions' },
      {
        label: 'Privacy Display',
        value: 'Samsung states the screen appears dark when viewed from an angle',
      },
      { label: 'Thickness', value: '7.9 mm as published on Samsung\u2019s US pages' },
      { label: 'Wireless charging', value: 'Super Fast Wireless Charging up to 25 W' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '6.9 inches across the full rectangle, 6.7 inches with rounded corners' },
          { label: 'Panel', value: 'Dynamic AMOLED 2X' },
          { label: 'Resolution', value: 'QHD+ as Samsung lists it' },
          { label: 'Refresh rate', value: 'Up to 120 Hz, adaptive' },
          {
            label: 'Privacy Display',
            value: 'Built in; Samsung says the display appears dark from an angle',
          },
        ],
      },
      {
        group: 'Performance and memory',
        rows: [
          { label: 'Processor', value: 'Snapdragon 8 Elite Gen 5 for Galaxy' },
          {
            label: 'US configurations',
            value: '12 GB of RAM with 256 GB or 512 GB of storage, and 16 GB with 1 TB',
          },
        ],
      },
      {
        group: 'Cameras',
        rows: [
          { label: 'Main', value: '200 MP wide, f/1.4' },
          { label: 'Ultra wide', value: '50 MP, f/1.9' },
          { label: 'Telephoto', value: '50 MP f/2.9 in a quad telephoto system with a 10 MP sensor' },
          { label: 'Front', value: '12 MP' },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Capacity', value: '5,000 mAh' },
          { label: 'Wired charging', value: 'Super Fast Charging 3.0 up to 60 W' },
          { label: 'Wireless charging', value: 'Super Fast Wireless Charging up to 25 W' },
          { label: 'Reverse charging', value: 'Wireless PowerShare' },
        ],
      },
      {
        group: 'Build and durability',
        rows: [
          { label: 'Frame', value: 'Armor Aluminum' },
          { label: 'Glass', value: 'Corning Gorilla Armor 2 on the front and back, as Samsung names it' },
          { label: 'Water and dust resistance', value: 'IP68' },
          { label: 'Thickness', value: '7.9 mm as published on Samsung\u2019s US pages' },
          {
            label: 'Not published by Samsung US',
            value: 'The phone\u2019s weight and full dimensions are not stated on the US pages for this model',
          },
        ],
      },
      {
        group: 'S Pen and Galaxy AI',
        rows: [
          { label: 'S Pen', value: "Included; Samsung states it does not support Bluetooth or Air Actions" },
          { label: 'Now Brief', value: 'Listed by Samsung among the Galaxy AI features' },
          { label: 'Now Nudge', value: 'Listed by Samsung among the Galaxy AI features' },
          { label: 'Photo Assist', value: 'Yes' },
          { label: 'Creative Studio', value: 'Yes' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Samsung does not publish the phone weight or full dimensions on the US pages for this model, so neither is listed here.',
          'Samsung describes an Armor Aluminum frame; it does not identify the S26 Ultra frame as titanium.',
          'The exact pixel resolution is not published on the US pages reviewed, so this sheet says QHD+, as Samsung does.',
          'Samsung states the S Pen does not support Bluetooth or Air Actions, so remote shutter and gesture control are out.',
          'Battery capacity and charging figures are Samsung ratings rather than independent measurements.',
        ],
      },
    ],
  },

  // ── Standalone entries (batch 2) ─────────────────────────────────────────
  'honor-robot-phone': {
    slug: 'honor-robot-phone',
    displayName: 'HONOR Robot Phone',
    status: 'available',
    product: {
      name: 'HONOR Robot Phone',
      category: 'Smartphones',
      categorySlug: 'smartphones',
      buyUrl: 'https://amzn.to/3WrnWlC',
      brand: 'HONOR',
      description:
        "HONOR's Robot Phone mounts a motorised 4-DoF gimbal camera on the back of a 6.31-inch handset, alongside a 200 MP main camera, a 200 MP periscope telephoto and a 7,060 mAh battery with 120 W charging.",
      features: [
        'Motorised 4-DoF gimbal camera with 3-axis mechanical stabilisation',
        '6.31-inch LTPO OLED at 1-120 Hz with a 6,800-nit peak brightness',
        '200 MP gimbal main camera and a 200 MP periscope telephoto',
        '7,060 mAh battery with 120 W wired and 50 W wireless HONOR SuperCharge',
        'MagicOS 10 on Android 16, with YOYO Robot Mode gestures',
      ],
    },
    // HONOR's own product and specification pages, including the China
    // specification page that carries the resolution, dimensions, weight and
    // IP rating, plus HONOR's launch announcement for the date and market.
    specSource:
      "HONOR's official Robot Phone product and specification pages (global and China) and HONOR's Robot Phone launch announcement, together with HONOR's official market and update pages — checked against HONOR's own pages in October 2026",
    metaDescription:
      'HONOR Robot Phone spec sheet: a motorised 4-DoF gimbal camera, a 6.31-inch 120 Hz LTPO OLED display, 200 MP cameras and a 7,060 mAh battery.',
    images: [
      '/product-images/honor-robot-phone-rear-view.webp',
      '/product-images/honor-robot-phone-robotic-camera-close-up.webp',
      '/product-images/honor-robot-phone-two-units.webp',
      '/product-images/honor-robot-phone-silver-pair.webp',
      '/product-images/honor-robot-phone-camera-arm.webp',
    ],
    highlights: [
      { label: 'Display', value: '6.31-inch LTPO OLED' },
      { label: 'Gimbal camera', value: '200 MP, 4-DoF' },
      { label: 'Telephoto', value: '200 MP, 2.7x optical' },
      { label: 'Battery', value: '7,060 mAh' },
      { label: 'Charging', value: '120 W wired' },
    ],
    keySpecs: [
      { label: 'Display', value: '6.31-inch LTPO OLED, 1216 x 2640, 1-120 Hz' },
      { label: 'Processor', value: 'Snapdragon 8 Elite Gen 5' },
      { label: 'Memory and storage', value: '12 GB + 512 GB, or 16 GB + 1 TB' },
      {
        label: 'Rear cameras',
        value: '200 MP gimbal main, 50 MP ultra wide and a 200 MP periscope telephoto',
      },
      { label: 'Robotic camera', value: '4-DoF motorised arm with 3-axis mechanical stabilisation' },
      { label: 'Front camera', value: '50 MP wide' },
      { label: 'Battery', value: '7,060 mAh' },
      { label: 'Charging', value: '120 W wired and 50 W wireless HONOR SuperCharge' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'HONOR' },
      { label: 'Model', value: 'Robot Phone' },
      { label: 'Announced', value: '12 August 2026, per HONOR' },
      {
        label: 'Sales market',
        value: 'China, per HONOR\u2019s own store and launch announcement',
      },
      { label: 'Dimensions', value: '151.43 x 72.86 x 9.59 mm' },
      { label: 'Weight', value: 'About 248 g including the battery' },
      { label: 'Water and dust', value: 'IP54' },
      { label: 'Operating system', value: 'MagicOS 10 based on Android 16' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '6.31 inches' },
          { label: 'Panel', value: 'LTPO OLED' },
          { label: 'Resolution', value: '1216 x 2640, FHD+ as HONOR lists it' },
          { label: 'Refresh rate', value: 'Adaptive 1-120 Hz' },
          { label: 'Peak brightness', value: '6,800 nits' },
        ],
      },
      {
        group: 'Performance and memory',
        rows: [
          { label: 'Processor', value: 'Snapdragon 8 Elite Gen 5 Mobile Platform' },
          { label: 'Memory', value: '12 GB or 16 GB' },
          { label: 'Storage', value: '512 GB or 1 TB' },
        ],
      },
      {
        group: 'Camera system',
        rows: [
          {
            label: 'Gimbal main camera',
            value: '200 MP, 1/1.28-inch sensor, f/1.6, optical image stabilisation',
          },
          { label: 'Ultra wide', value: '50 MP, f/2.0, 122-degree field of view' },
          {
            label: 'Periscope telephoto',
            value: '200 MP, 1/1.4-inch sensor, f/2.6, 2.7x optical zoom and optical image stabilisation',
          },
          { label: 'Digital zoom', value: 'Up to 200x, as HONOR lists it' },
          { label: 'Front camera', value: '50 MP wide, f/2.0, up to a 90-degree field of view' },
        ],
      },
      {
        group: 'Robotic camera',
        rows: [
          { label: 'Degrees of freedom', value: '4-DoF motorised movement' },
          { label: 'Stabilisation', value: '3-axis mechanical gimbal stabilisation' },
          { label: 'HONOR\u2019s name for it', value: 'Titanium Agile Gimbal' },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Capacity', value: '7,060 mAh' },
          { label: 'Wired charging', value: '120 W HONOR SuperCharge' },
          { label: 'Wireless charging', value: '50 W HONOR SuperCharge' },
        ],
      },
      {
        group: 'Build',
        rows: [
          { label: 'Dimensions', value: '151.43 x 72.86 x 9.59 mm' },
          { label: 'Weight', value: 'About 248 g including the battery' },
          { label: 'Water and dust resistance', value: 'IP54' },
        ],
      },
      {
        group: 'Software and AI',
        rows: [
          { label: 'Operating system', value: 'MagicOS 10 based on Android 16' },
          { label: 'YOYO Robot Mode', value: 'Listed by HONOR with multimodal perception and gesture recognition' },
          { label: 'Subject tracking', value: 'AI subject tracking and voice-source localisation' },
          { label: 'Gestures', value: 'Hands-free gesture controls' },
          { label: 'Camera features', value: 'Camera Agent, Magic Pose and AI-assisted composition' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'HONOR publishes no Robot Phone-specific operating-system or security-update commitment; its seven-year announcement covers the Magic series, not this model.',
          'The IP54 rating HONOR lists covers splashes rather than immersion.',
          'HONOR identifies China as the sales market for the Robot Phone, and no HONOR US sales page for it was found.',
          'The zoom figures are HONOR\u2019s own: 2.7x optical on the periscope telephoto and up to 200x digital.',
          'Battery capacity and charging wattages are HONOR ratings rather than independent measurements.',
        ],
      },
    ],
  },

  'apple-iphone-17-pro-max': {
    slug: 'apple-iphone-17-pro-max',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$1,289',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'Apple iPhone 17 Pro Max',
    status: 'available',
    product: {
      name: 'Apple iPhone 17 Pro Max',
      category: 'Smartphones',
      categorySlug: 'smartphones',
      buyUrl: 'https://amzn.to/4jieTwY',
      brand: 'Apple',
      description:
        "Apple's 2025 flagship: a 6.9-inch Super Retina XDR OLED display at up to 120 Hz, the A19 Pro chip, a 48 MP Pro Fusion camera system with 8x optical-quality zoom and up to 39 hours of video playback.",
      features: [
        '6.9-inch OLED Super Retina XDR at up to 120 Hz with an Always-On display',
        'A19 Pro with a 6-core CPU, 6-core GPU and 16-core Neural Engine',
        '48 MP Pro Fusion camera system with 8x optical-quality zoom',
        'Up to 39 hours of video playback, per Apple',
        'IP68 to 6 metres, in an aluminum unibody with Ceramic Shield 2',
      ],
    },
    // Apple's own technical-specifications page for this model on Apple
    // Support, Apple's launch announcement, and Apple's current line-up page
    // (which no longer lists it) for the availability note.
    specSource:
      "Apple's iPhone 17 Pro Max technical specifications on Apple Support, Apple's September 2025 launch announcement for the iPhone 17 Pro and iPhone 17 Pro Max, and Apple's current iPhone line-up page — checked against Apple's own pages in October 2026",
    metaDescription:
      'iPhone 17 Pro Max spec sheet: a 6.9-inch 120 Hz display, the A19 Pro chip, a 48 MP Pro Fusion camera system and up to 39 hours of video playback.',
    images: [
      '/product-images/apple-iphone-17-pro-max-colours.webp',
      '/product-images/apple-iphone-17-pro-max-orange-and-front.webp',
      '/product-images/apple-iphone-17-pro-max-camera-array.webp',
      '/product-images/apple-iphone-17-pro-max-in-hand.webp',
      '/product-images/apple-iphone-17-pro-max-control-center.webp',
      '/product-images/apple-iphone-17-pro-max-live-translation-call.webp',
      '/product-images/apple-iphone-17-pro-max-home-screen.webp',
      '/product-images/apple-iphone-17-pro-max-app-icons.webp',
    ],
    highlights: [
      { label: 'Display', value: '6.9-inch OLED' },
      { label: 'Chip', value: 'A19 Pro' },
      { label: 'Main camera', value: '48 MP' },
      { label: 'Zoom', value: '8x optical-quality' },
      { label: 'Video playback', value: 'Up to 39 h' },
    ],
    keySpecs: [
      { label: 'Display', value: '6.9-inch OLED Super Retina XDR, 2868 x 1320 at 460 ppi' },
      { label: 'Refresh rate', value: 'ProMotion, adaptive up to 120 Hz, with an Always-On display' },
      { label: 'Chip', value: 'A19 Pro, 6-core CPU, 6-core GPU and 16-core Neural Engine' },
      { label: 'Storage', value: '256 GB, 512 GB, 1 TB or 2 TB' },
      { label: 'Rear cameras', value: '48 MP Fusion Main, 48 MP Fusion Ultra Wide and 48 MP Fusion Telephoto' },
      { label: 'Front camera', value: '18 MP Center Stage with autofocus' },
      { label: 'Battery', value: 'Up to 39 hours of video playback, per Apple' },
      { label: 'Charging', value: 'Up to 50% in 20 minutes with a 40 W-or-higher adapter' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Apple' },
      { label: 'Model', value: 'iPhone 17 Pro Max' },
      { label: 'Weight', value: '233 g (8.22 oz)' },
      { label: 'Dimensions', value: '163.4 x 78.0 x 8.75 mm' },
      { label: 'Materials', value: 'Aluminum unibody, Ceramic Shield 2 front and Ceramic Shield back' },
      {
        label: 'Thermal design',
        value: 'Apple-designed vapor chamber laser-welded into the aluminum chassis',
      },
      { label: 'SIM', value: 'US models use dual eSIM and do not take a physical SIM card' },
      { label: 'Water and dust resistance', value: 'IP68, to a maximum depth of 6 metres for up to 30 minutes' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '6.9 inches diagonally' },
          { label: 'Type', value: 'OLED Super Retina XDR, all-screen' },
          { label: 'Resolution', value: '2868 x 1320 at 460 ppi' },
          { label: 'Refresh rate', value: 'ProMotion with adaptive rates up to 120 Hz' },
          { label: 'Always-On display', value: 'Yes' },
        ],
      },
      {
        group: 'Performance',
        rows: [
          {
            label: 'Chip',
            value: 'A19 Pro, 6-core CPU with 2 performance and 4 efficiency cores',
          },
          { label: 'Graphics', value: '6-core GPU with Neural Accelerators' },
          { label: 'Neural Engine', value: '16-core' },
          { label: 'Ray tracing', value: 'Hardware-accelerated, per Apple' },
          {
            label: 'Sustained performance',
            value: 'Apple attributes up to 40% better sustained performance than the previous generation to the chip and vapor chamber',
          },
        ],
      },
      {
        group: 'Cameras',
        rows: [
          {
            label: 'Fusion Main',
            value: '48 MP, 24 mm, f/1.78, second-generation sensor-shift stabilisation',
          },
          { label: 'Fusion Ultra Wide',
            value: '48 MP, 13 mm, f/2.2, 120-degree field of view' },
          {
            label: 'Fusion Telephoto',
            value: '48 MP, 100 mm (4x), f/2.8, tetraprism design with 3D sensor-shift stabilisation',
          },
          {
            label: 'Zoom',
            value: '8x optical-quality in, 2x optical out, a 16x optical-quality range and up to 40x digital',
          },
          { label: 'Front camera', value: '18 MP Center Stage, f/1.9, autofocus with Focus Pixels' },
        ],
      },
      {
        group: 'Video and audio',
        rows: [
          {
            label: '4K Dolby Vision',
            value: '24, 25, 30, 60, 100 or 120 fps on the Fusion Main camera',
          },
          { label: 'Slo-mo', value: '1080p up to 240 fps and 4K Dolby Vision up to 120 fps' },
          {
            label: 'ProRes',
            value: 'Up to 4K at 120 fps with external recording, plus ProRes RAW',
          },
          { label: 'Other video', value: 'Cinematic mode up to 4K at 30 fps and Action mode up to 2.8K at 60 fps' },
          {
            label: 'Audio playback hours',
            value: 'Not stated by Apple on the US technology-specifications page for this model',
          },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Video playback', value: 'Up to 39 hours, per Apple' },
          { label: 'Streamed video playback', value: 'Up to 35 hours, per Apple' },
          {
            label: 'Wired charging',
            value: 'Up to 50% in 20 minutes with a 40 W-or-higher adapter and a USB-C cable',
          },
          {
            label: 'Wireless charging',
            value: 'Up to 25 W with MagSafe or Qi2, or up to 50% in 30 minutes on MagSafe with a 30 W-or-higher adapter',
          },
        ],
      },
      {
        group: 'Build and durability',
        rows: [
          { label: 'Frame', value: 'Aluminum unibody' },
          { label: 'Glass', value: 'Ceramic Shield 2 on the front and Ceramic Shield on the back' },
          {
            label: 'Water and dust resistance',
            value: 'IP68 under IEC 60529, to a maximum depth of 6 metres for up to 30 minutes',
          },
          { label: 'Weight', value: '233 g (8.22 oz)' },
          { label: 'Dimensions', value: '163.4 x 78.0 x 8.75 mm' },
        ],
      },
      {
        group: 'Connectivity',
        rows: [
          { label: 'Port', value: 'USB-C with USB 3 support up to 10 Gb/s, plus DisplayPort' },
          { label: 'Wi-Fi', value: 'Wi-Fi 7 (802.11be) with 2x2 MIMO' },
          { label: 'Bluetooth', value: 'Bluetooth 6' },
          { label: 'Cellular', value: '5G including sub-6GHz and mmWave, per Apple' },
          { label: 'SIM', value: 'Dual eSIM on US models, with no physical SIM card slot' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Apple\u2019s current iPhone line-up page does not include the iPhone 17 Pro Max, so Apple no longer presents it as a current model.',
          'Apple publishes no audio-playback hour figure for this model on the US technology-specifications page.',
          'US models use dual eSIM and are not compatible with physical SIM cards, per Apple.',
          'Apple describes Apple Intelligence as beta and notes that feature and language availability may vary.',
          'Battery hours and charging times are Apple ratings under set conditions rather than independent measurements.',
        ],
      },
    ],
  },

  'vivo-x300-pro': {
    slug: 'vivo-x300-pro',
    // Priced per configuration, kept exactly as the owner typed it (approximate
    // figures with their ranges), with the Amazon US listing as its own row.
    priceBox: {
      label: 'Prices by configuration',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
      rows: [
        { label: '12GB RAM + 256GB', amount: 'around $779 - $869' },
        { label: '12GB RAM + 256GB (Amazon US listing)', amount: 'around $1,099' },
        { label: '16GB RAM + 512GB', amount: 'around $899 - $1,018' },
        { label: '16GB RAM + 1TB', amount: 'around $979' },
      ],
    },
    displayName: 'vivo X300 Pro',
    status: 'available',
    product: {
      name: 'vivo X300 Pro',
      category: 'Smartphones',
      categorySlug: 'smartphones',
      buyUrl: 'https://amzn.to/4jV4GXs',
      brand: 'vivo',
      description:
        "vivo's camera-led flagship: a 6.78-inch AMOLED display at up to 120 Hz, a MediaTek Dimensity 9500, a 200 MP ZEISS APO telephoto and a 6,510 mAh battery with 90 W charging.",
      features: [
        '6.78-inch AMOLED with an LTPO 1-120 Hz refresh rate',
        'MediaTek Dimensity 9500 with 16 GB of LPDDR5X Ultra memory',
        '200 MP ZEISS APO telephoto with 3.5x optical zoom',
        '6,510 mAh battery with 90 W wired and 40 W wireless FlashCharge',
        'IP68 and IP69 ratings',
      ],
    },
    // vivo's own specification pages. The global and India pages carry the
    // 6,510 mAh battery figure and vivo states it applies to "Overseas (except
    // Europe)"; the Europe page publishes 5,440 mAh, and both are recorded
    // rather than averaged.
    specSource:
      "vivo's official X300 Pro product and specification pages for the global, India and Europe markets, together with vivo's official country/region selector and international-warranty page — checked against vivo's own pages in October 2026",
    metaDescription:
      'vivo X300 Pro spec sheet: a 6.78-inch 120 Hz AMOLED display, a Dimensity 9500, a 200 MP ZEISS telephoto and a 6,510 mAh battery with 90 W charging.',
    images: [
      '/product-images/vivo-x300-pro-box-and-phone.webp',
      '/product-images/vivo-x300-pro-rear-camera.webp',
      '/product-images/vivo-x300-pro-camera-module.webp',
      '/product-images/vivo-x300-pro-box-contents.webp',
    ],
    highlights: [
      { label: 'Display', value: '6.78-inch AMOLED' },
      { label: 'Chip', value: 'Dimensity 9500' },
      { label: 'Telephoto', value: '200 MP ZEISS' },
      { label: 'Battery', value: '6,510 mAh' },
      { label: 'Charging', value: '90 W wired' },
    ],
    keySpecs: [
      { label: 'Display', value: '6.78-inch AMOLED, 2800 x 1260, LTPO 1-120 Hz' },
      { label: 'Chipset', value: 'MediaTek Dimensity 9500' },
      { label: 'Memory and storage', value: '16 GB of RAM with 512 GB of storage' },
      {
        label: 'Rear cameras',
        value: '50 MP main, 50 MP ultra wide and a 200 MP ZEISS APO telephoto',
      },
      { label: 'Front camera', value: '50 MP with autofocus' },
      { label: 'Battery', value: '6,510 mAh typical outside Europe, per vivo' },
      { label: 'Charging', value: '90 W wired FlashCharge and 40 W wireless' },
      { label: 'Durability', value: 'IP68 and IP69' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'vivo' },
      { label: 'Model', value: 'X300 Pro' },
      { label: 'Dimensions', value: '161.98 x 75.48 x 7.99 mm' },
      { label: 'Weight', value: '226 g' },
      { label: 'Operating system', value: 'OriginOS 6, based on Android 16' },
      { label: 'Fingerprint sensor', value: '3D ultrasonic' },
      {
        label: 'Sales markets',
        value: 'vivo\u2019s country selector does not list the United States',
      },
      { label: 'Expandable storage', value: 'Not supported, per vivo' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '6.78 inches' },
          { label: 'Panel', value: 'AMOLED' },
          { label: 'Resolution', value: '2800 x 1260 at 452 ppi' },
          { label: 'Refresh rate', value: 'LTPO, adaptive 1-120 Hz' },
          { label: 'Peak brightness', value: '4,500 nits local peak' },
        ],
      },
      {
        group: 'Performance and memory',
        rows: [
          { label: 'Chipset', value: 'MediaTek Dimensity 9500, 8-core CPU' },
          { label: 'Memory', value: '16 GB LPDDR5X Ultra' },
          { label: 'Storage', value: '512 GB UFS 4.1' },
          { label: 'Expandable storage', value: 'Not supported, per vivo' },
        ],
      },
      {
        group: 'Cameras',
        rows: [
          {
            label: 'Main',
            value: '50 MP Sony LYT-828, f/1.57, optical image stabilisation, ZEISS Gimbal-Grade',
          },
          { label: 'Ultra wide', value: '50 MP JN1, f/2.0, autofocus, 119 degrees' },
          {
            label: 'Telephoto',
            value: '200 MP HPB, f/2.67, autofocus, optical image stabilisation, ZEISS APO',
          },
          { label: 'Optical zoom', value: '3.5x on the telephoto, as vivo states' },
          { label: 'Front', value: '50 MP JN1, f/2.0, autofocus, 92 degrees, ZEISS' },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Capacity', value: '6,510 mAh typical' },
          {
            label: 'Region note from vivo',
            value: 'vivo states the 6,510 mAh figure applies to Overseas (except Europe); its Europe page lists 5,440 mAh typical',
          },
          { label: 'Wired charging', value: '90 W FlashCharge' },
          { label: 'Wireless charging', value: '40 W' },
        ],
      },
      {
        group: 'Build',
        rows: [
          { label: 'Dimensions', value: '161.98 x 75.48 x 7.99 mm' },
          { label: 'Weight', value: '226 g' },
          { label: 'Water and dust resistance', value: 'IP68 and IP69' },
        ],
      },
      {
        group: 'Software and connectivity',
        rows: [
          { label: 'Operating system', value: 'OriginOS 6, based on Android 16' },
          { label: 'Wi-Fi', value: 'Wi-Fi 6 and Wi-Fi 7' },
          { label: 'Bluetooth', value: 'Bluetooth 6.0' },
          { label: 'Port', value: 'USB 3.2 Gen 1' },
          { label: 'Fingerprint sensor', value: '3D ultrasonic' },
          { label: 'Infrared blaster', value: 'Included' },
          { label: 'Hi-Fi audio', value: 'Not supported, per vivo' },
          { label: 'FM radio', value: 'Not supported, per vivo' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'vivo\u2019s official country selector does not list the United States, and no vivo US sales or support listing for the X300 Pro was found.',
          'vivo publishes two different battery figures by region rather than one: 6,510 mAh for markets outside Europe and 5,440 mAh on its Europe page.',
          'vivo does not publish a speaker configuration for this model, so no speaker row is listed here.',
          'Storage is not expandable, per vivo, and the pages reviewed list only 16 GB with 512 GB.',
          'vivo states that analogue earphones need a separately purchased USB-C adapter with a built-in DAC.',
        ],
      },
    ],
  },

  'apple-ipad-air-11-m3': {
    slug: 'apple-ipad-air-11-m3',
    // Priced per storage variant, all Wi-Fi models: one row each.
    priceBox: {
      label: 'Prices by capacity (Wi-Fi)',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
      rows: [
        { label: '128GB', amount: '$749' },
        { label: '256GB', amount: '$849' },
        { label: '512GB', amount: '$1,049' },
        { label: '1TB', amount: '$1,349' },
      ],
    },
    displayName: 'Apple iPad Air 11 (M3)',
    status: 'available',
    product: {
      name: 'Apple iPad Air 11-inch (M3)',
      category: 'Laptops & PCs',
      categorySlug: 'laptops',
      buyUrl: 'https://amzn.to/4ilnCNV',
      brand: 'Apple',
      description:
        "The 11-inch iPad Air built on Apple's M3 chip, with a Liquid Retina display, 8 GB of memory, support for Apple Pencil Pro and Magic Keyboard, and a landscape 12 MP Center Stage front camera.",
      features: [
        '11-inch Liquid Retina display at 2360 x 1640 and 500 nits',
        'Apple M3 with an 8-core CPU, 9-core GPU and 16-core Neural Engine',
        '8 GB of memory and storage from 128 GB up to 1 TB',
        'Apple Pencil Pro and Apple Pencil (USB-C) support',
        'Landscape 12 MP Center Stage front camera',
      ],
    },
    // Apple's own technical-specifications page for the M3 iPad Air on Apple
    // Support, plus Apple's March 2025 announcement for the release date, the
    // storage tiers, the colours and iPadOS 18 at launch.
    specSource:
      "Apple's 11-inch iPad Air (M3) technical specifications on Apple Support and Apple's March 2025 iPad Air with M3 announcement — checked against Apple's own pages in October 2026",
    metaDescription:
      'iPad Air 11-inch (M3) spec sheet: a 2360 x 1640 Liquid Retina display, the M3 chip, Apple Pencil Pro support and up to 10 hours of battery life.',
    images: [
      '/product-images/apple-ipad-air-11-m3-display.webp',
      '/product-images/apple-ipad-air-11-m3-gray-front-and-back.webp',
      '/product-images/apple-ipad-air-11-m3-gold-front-and-back.webp',
      '/product-images/apple-ipad-air-11-m3-blue.webp',
      '/product-images/apple-ipad-air-11-m3-purple.webp',
      '/product-images/apple-ipad-air-11-m3-space-gray.webp',
      '/product-images/apple-ipad-air-11-m3-starlight.webp',
      '/product-images/apple-ipad-air-11-m3-purple-display.webp',
    ],
    highlights: [
      { label: 'Display', value: '11-inch Liquid Retina' },
      { label: 'Chip', value: 'Apple M3' },
      { label: 'Memory', value: '8 GB' },
      { label: 'Storage', value: '128 GB to 1 TB' },
      { label: 'Battery', value: 'Up to 10 h' },
    ],
    keySpecs: [
      { label: 'Display', value: '11-inch Liquid Retina, 2360 x 1640 at 264 ppi and 500 nits' },
      { label: 'Chip', value: 'Apple M3 with an 8-core CPU, 9-core GPU and 16-core Neural Engine' },
      { label: 'Memory', value: '8 GB' },
      { label: 'Storage', value: '128 GB, 256 GB, 512 GB or 1 TB' },
      { label: 'Rear camera', value: '12 MP Wide, f/1.8, with 4K video recording' },
      { label: 'Front camera', value: 'Landscape 12 MP Center Stage, f/2.0' },
      { label: 'Battery', value: '28.93 Wh, up to 10 hours of web surfing or video' },
      { label: 'Weight', value: '460 g (1.01 lb)' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Apple' },
      { label: 'Model', value: 'iPad Air 11-inch (M3)' },
      { label: 'Introduced', value: '4 March 2025, arriving 12 March 2025 per Apple' },
      { label: 'Colours', value: 'Blue, purple, starlight and space gray' },
      { label: 'Apple Pencil', value: 'Apple Pencil Pro and Apple Pencil (USB-C)' },
      { label: 'Keyboard', value: 'Magic Keyboard for iPad Air' },
      { label: 'Touch ID', value: 'Built into the top button' },
      { label: 'Operating system at launch', value: 'iPadOS 18' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: 'Marketed as 11 inches; Apple lists 10.86 inches diagonally as a rectangle' },
          { label: 'Type', value: 'Liquid Retina, LED-backlit Multi-Touch with IPS' },
          { label: 'Resolution', value: '2360 x 1640 at 264 ppi' },
          { label: 'Brightness', value: '500 nits' },
          { label: 'Extras', value: 'P3 wide colour, True Tone, full lamination and antireflective coating' },
        ],
      },
      {
        group: 'Performance and memory',
        rows: [
          { label: 'Chip', value: 'Apple M3' },
          { label: 'CPU', value: '8-core, with 4 performance and 4 efficiency cores' },
          { label: 'GPU', value: '9-core' },
          { label: 'Neural Engine', value: '16-core' },
          { label: 'Memory', value: '8 GB' },
          { label: 'Storage', value: '128 GB, 256 GB, 512 GB or 1 TB' },
        ],
      },
      {
        group: 'Cameras',
        rows: [
          { label: 'Rear', value: '12 MP Wide, f/1.8' },
          { label: 'Rear video', value: '4K at 24, 25, 30 or 60 fps, and 1080p slo-mo at 120 or 240 fps' },
          {
            label: 'Front',
            value: 'Landscape 12 MP Center Stage, f/2.0, with 1080p video at 25, 30 or 60 fps',
          },
          {
            label: 'Front camera position',
            value: 'On the right of the display in landscape, per Apple\u2019s connector diagram',
          },
        ],
      },
      {
        group: 'Pencil and keyboard',
        rows: [
          { label: 'Apple Pencil Pro', value: 'Supported' },
          { label: 'Apple Pencil (USB-C)', value: 'Supported' },
          { label: 'Keyboard', value: 'Magic Keyboard for iPad Air' },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Battery', value: 'Built-in 28.93-watt-hour rechargeable lithium-polymer' },
          {
            label: 'Web surfing or video',
            value: 'Up to 10 hours on Wi-Fi, per Apple',
          },
          { label: 'Cellular browsing', value: 'Up to 9 hours on Wi-Fi + Cellular models, per Apple' },
          { label: 'In the box', value: 'A 20 W USB-C power adapter, per Apple\u2019s specification page' },
        ],
      },
      {
        group: 'Connectivity',
        rows: [
          { label: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax) with 2x2 MIMO' },
          { label: 'Bluetooth', value: 'Bluetooth 5.3' },
          { label: 'Port', value: 'USB-C with USB 3 support up to 10 Gb/s' },
          { label: 'Touch ID', value: 'In the top button' },
        ],
      },
      {
        group: 'Build',
        rows: [
          { label: 'Dimensions', value: '247.6 x 178.5 x 6.1 mm' },
          { label: 'Weight', value: '460 g (1.01 lb), for both Wi-Fi and cellular models per Apple' },
          { label: 'Colours', value: 'Blue, purple, starlight and space gray' },
          {
            label: 'Water and dust resistance',
            value: 'Apple states no water or dust rating for this model',
          },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Apple\u2019s current iPad Air product page promotes the M4 generation, so the M3 model this sheet describes is no longer the current generation on Apple\u2019s site.',
          'Apple lists a 20 W USB-C power adapter in the box and states no faster-charging figure on the technical-specifications page.',
          'Apple publishes no water or dust resistance rating for the iPad Air.',
          'The 10-hour battery figure is Apple\u2019s own web-surfing and video rating rather than an independent measurement.',
          'The display measures 10.86 inches diagonally as a rectangle, which Apple markets as 11 inches.',
        ],
      },
    ],
  },

  // ── Announcement-only entry ───────────────────────────────────────────────
  // Apple HomeView is not sold by this store and Apple does not sell it through
  // Amazon, so this entry is INFORMATIONAL: no buy link, no purchase panel and
  // no affiliate disclosure on the page. Two things follow from that and are
  // deliberate, not oversights:
  // - No rating and no review count: there is no listing to take one from, and
  //   the page must never present Amazon's or anyone else's figures as ours.
  // - The page's one price lives in `priceBox`: Apple's own announced US
  //   figures, typed in from Apple's pages with a source and an `asOf` date. It
  //   is a launch price, not a live or falling one, and the guide below quotes
  //   the same dated figures in prose. A page with a price box may carry no
  //   Amazon link, and this one has none.
  'apple-homeview-smart-display': {
    slug: 'apple-homeview-smart-display',
    displayName: 'Apple HomeView',
    status: 'upcoming',
    informational: true,
    // The gallery note. Its wording names Apple and its announcement date, which
    // is why it lives here rather than in the shared component.
    illustrationNote:
      'The images above are illustrations based on the design Apple announced on October 13, 2026, not photographs of a shipping unit.',
    // The page's only price surface. Apple's own announced US figures, typed in
    // from Apple's pages and dated — never an Amazon price, and this entry has
    // no Amazon link, which the guard enforces in both directions.
    priceBox: {
      label: 'Apple’s announced US launch price',
      amount: '$299',
      asOf: '2026-10-19',
      source: 'Apple Newsroom and Apple’s buy page, October 2026',
      rows: [
        { label: 'HomeView (tabletop)', amount: '$299', note: 'No mount needed' },
        {
          label: 'HomeView (Wall Mounted) + Power Mount USB-C Wall Connector',
          amount: '$358.95',
        },
        { label: 'HomeView (Wall Mounted) + Power Mount AC Wired', amount: '$378.95' },
        {
          label: 'HomeView (Wall Mounted) + Power Mount PoE Wired',
          amount: '$428.95',
          note: 'Mount arrives early 2027',
        },
      ],
      note: 'Wall-mounted totals exclude the USB-C cable and the power adapter: Apple sells both separately and lists no price for either. Prices differ by country, and every figure is before tax and shipping.',
    },
    product: {
      name: 'Apple HomeView',
      category: 'Smart Home',
      categorySlug: 'smart-home',
      brand: 'Apple',
      description:
        'Apple\u2019s first smart display: a 7-inch Liquid Retina screen on a domed speaker base, or a flat wall-mounted panel, both powered by the A18 chip with Siri AI. Pre-orders opened on October 13, 2026 and availability begins on November 13.',
      features: [
        '7-inch Liquid Retina display, 1088-by-1088 pixels at 220 ppi',
        'A18 chip with Secure Exclaves for camera and microphone data',
        'Siri AI, powered by Apple Intelligence',
        'Two models: a tabletop version on a domed base, or a wall-mounted panel',
        'Tabletop version in four colors, the wall-mounted version in two',
        'Pre-orders open now, with availability beginning November 13',
      ],
      altText:
        'Apple HomeView render: silver tabletop model with music playing on screen',
    },
    // Apple's own pages only. Every row below was read on one of them on
    // October 17, 2026; nothing is carried over from reporting or from memory.
    specSource:
      "Apple's HomeView newsroom announcement, Apple's HomeView product and technical-specifications pages, Apple's US, Canadian, UK, Australian, Indian, New Zealand and Singapore buy pages, and Apple's HomePod mini 2, Apple TV 4K and Home Collection announcements — all read on apple.com on October 19, 2026",
    metaTitle: 'Apple HomeView Specs, Dimensions & Buying Guide',
    metaDescription:
      'Apple HomeView spec sheet: the 7-inch Liquid Retina display, A18 chip, Siri AI, audio system, colors, both models and what a wall mount needs.',
    // Position-matched to `images` below, and written while looking at each
    // file. They are renders — Apple has published no photographs these could
    // copy — so the wording says "render" and names only what the picture shows.
    imageAlts: [
      'Apple HomeView tabletop in Silver, render',
      'Apple HomeView tabletop in Starlight, render',
      'Apple HomeView tabletop in Rose Pink, render',
      'Apple HomeView tabletop in Space Gray, render',
      'Apple HomeView wall-mounted in Silver, render',
      'Apple HomeView wall-mounted in Space Gray, render',
    ],
    images: [
      '/product-images/apple-homeview-silver.webp',
      '/product-images/apple-homeview-starlight.webp',
      '/product-images/apple-homeview-rose-pink.webp',
      '/product-images/apple-homeview-space-gray.webp',
      '/product-images/apple-homeview-wall-mounted-silver.webp',
      '/product-images/apple-homeview-wall-mounted-space-gray.webp',
    ],
    highlights: [
      { label: 'Display', value: '7-inch Liquid Retina' },
      { label: 'Chip', value: 'A18' },
      { label: 'Camera', value: '12MP Center Stage' },
      { label: 'Wireless', value: 'Wi-Fi 6E, BT 6.0, Thread' },
      { label: 'Availability', value: 'From November 13' },
    ],
    // The chips choose which of the six renders above is shown (variantImages
    // below); they never change a figure, so the price box is untouched.
    // Wall-mounted availability re-checked on apple.com on October 21, 2026:
    // the wall-mounted model comes in Silver and Space Gray only.
    variants: [
      {
        label: 'Model',
        options: [
          { label: 'HomeView', note: 'Tabletop: domed speaker base, cable and 30W adapter in the box' },
          { label: 'HomeView (Wall Mounted)', note: 'Flat panel: mount, cable and adapter sold separately' },
        ],
      },
      {
        label: 'Color',
        // One caption for the whole dimension: the old per-option notes
        // ("Both models") were wrong once the model could be wall-mounted.
        note: 'Tabletop: 4 colors. Wall mounted: Space Gray and Silver.',
        options: [
          { label: 'Silver' },
          {
            label: 'Starlight',
            disabledWhen: { group: 'Model', options: ['HomeView (Wall Mounted)'] },
          },
          {
            label: 'Rose Pink',
            disabledWhen: { group: 'Model', options: ['HomeView (Wall Mounted)'] },
          },
          { label: 'Space Gray' },
        ],
      },
    ],
    // Owner's six files in "Apple HomeView Price, Release Date, Specs & Features",
    // each already on this page as the render of the same name. Key order follows
    // `variants`: Model, then Color.
    variantImages: {
      'HomeView + Silver': '/product-images/apple-homeview-silver.webp',
      'HomeView + Starlight': '/product-images/apple-homeview-starlight.webp',
      'HomeView + Rose Pink': '/product-images/apple-homeview-rose-pink.webp',
      'HomeView + Space Gray': '/product-images/apple-homeview-space-gray.webp',
      'HomeView (Wall Mounted) + Silver':
        '/product-images/apple-homeview-wall-mounted-silver.webp',
      'HomeView (Wall Mounted) + Space Gray':
        '/product-images/apple-homeview-wall-mounted-space-gray.webp',
    },
    keySpecs: [
      { label: 'Display', value: '7-inch (diagonal) Liquid Retina, 1088-by-1088 pixels at 220 ppi' },
      { label: 'Chip', value: 'A18 chip with Secure Exclaves' },
      { label: 'Camera', value: '12MP Center Stage camera, \u0192/2.4 aperture' },
      { label: 'Speakers, tabletop', value: 'Two full-range drivers, a down-firing woofer and dual force-cancelling passive radiators' },
      { label: 'Speakers, wall mounted', value: 'Two custom full-range drivers, tuned for on-wall placement' },
      { label: 'Wireless', value: 'Wi-Fi 6E, Bluetooth 6.0 and Thread' },
      { label: 'Size', value: 'Tabletop: 5.73 in (14.55 cm), then 5.38–6.82 in and 3.78–5.13 in as Apple lists them; wall mounted: 5.73 in, 5.73 in and 0.39 in' },
      { label: 'Setup', value: 'Pairs with an iPhone on iOS 27.2 or an iPad on iPadOS 27.2' },
      { label: 'Power', value: 'Wired; USB-C, with the wall-mounted model requiring a separate adapter of at least 20W' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Apple' },
      { label: 'Models', value: 'Apple HomeView and Apple HomeView (Wall Mounted)' },
      { label: 'Weight, tabletop', value: '2.1 pounds (952 grams)' },
      { label: 'Weight, wall mounted', value: '0.63 pound (286 grams)' },
      { label: 'In the box, tabletop', value: 'HomeView, a 1.5 m USB-C cable, a 30W power adapter and documentation' },
      { label: 'In the box, wall mounted', value: 'HomeView (Wall Mounted) and documentation only' },
      { label: 'Product images', value: 'Illustrations based on Apple\u2019s announced design, not photographs' },
      { label: 'Last updated', value: 'October 19, 2026' },
    ],
    specs: [
      {
        group: 'Models and availability',
        rows: [
          { label: 'Models', value: 'Apple HomeView (tabletop) and Apple HomeView (Wall Mounted)' },
          { label: 'Announced', value: 'October 13, 2026' },
          { label: 'Availability', value: 'Beginning Friday, November 13, 2026' },
          { label: 'First-wave countries', value: 'Australia, Canada, India, New Zealand, the UK and the US, with Singapore pre-orders from October 15 and South Africa through Apple Authorized Resellers' },
          { label: 'Where to order', value: 'apple.com, the Apple Store app and select partners; Apple says all first-wave countries share the November 13 date' },
          { label: 'Not sold in', value: 'The European Union \u2014 Apple states Siri AI is currently unavailable in iOS in the EU' },
        ],
      },
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '7-inch (diagonal) Liquid Retina; Apple notes the measured diagonal is 6.98 inches' },
          { label: 'Type', value: 'LED backlit Multi-Touch display with IPS technology' },
          { label: 'Resolution', value: '1088-by-1088 pixels at 220 ppi' },
          { label: 'Brightness', value: '500 nits maximum, 0.3 nits minimum' },
          { label: 'Adaptive', value: 'True Tone and automatic brightness; the interface reveals more detail as you step closer' },
          { label: 'Coating', value: 'Fingerprint-resistant oleophobic coating' },
        ],
      },
      {
        group: 'Chip, camera and microphones',
        rows: [
          { label: 'Chip', value: 'A18 chip, with Secure Exclaves that process camera and microphone data' },
          { label: 'Camera', value: '12MP Center Stage camera, \u0192/2.4 aperture' },
          { label: 'Calls', value: 'FaceTime video and audio over Wi-Fi to any FaceTime-enabled device' },
          { label: 'Microphones', value: 'Four-microphone design for far-field Siri \u2014 front, left, right and rear' },
        ],
      },
      {
        group: 'Audio',
        rows: [
          { label: 'Tabletop speakers', value: 'Two custom full-range drivers in the display, a custom down-firing woofer and dual force-cancelling passive radiators in the base' },
          { label: 'Wall-mounted speakers', value: 'Two custom full-range drivers, with computational audio tuned for on-wall placement' },
          { label: 'Spatial Audio', value: 'Dolby Atmos for music and video' },
          { label: 'Tuning', value: 'Computational audio adjusts loudness and bass response in real time' },
          { label: 'Multiroom', value: 'AirPlay with HomePod, Apple TV 4K and compatible speakers' },
          { label: 'Sound recognition', value: 'Detects smoke and carbon monoxide alarm sounds and alerts your iPhone, iPad or Apple Watch' },
        ],
      },
      {
        group: 'Siri AI and users',
        rows: [
          { label: 'Assistant', value: 'Siri AI, powered by Apple Intelligence; hands-free with \u201CSiri\u201D or \u201CHey Siri\u201D' },
          { label: 'Without a paired device', value: 'Broad world knowledge, natural conversation and music discovery still work' },
          { label: 'Personal context', value: 'Needs an Apple Intelligence-enabled iPhone or iPad nearby' },
          { label: 'Recognized users', value: 'Up to six people, each with their own Home Screen apps and widgets' },
          { label: 'Faces', value: 'Photos, Flow and Snoopy, plus informative faces such as Calendar and Weather' },
          { label: 'Languages', value: 'Siri AI starts in English in the US, Australia, Canada, India, New Zealand, Singapore, South Africa and the UK; Canadian French arrives later by software update' },
        ],
      },
      {
        group: 'Smart home',
        rows: [
          { label: 'Home app', value: 'Built in and synced with your other Apple devices' },
          { label: 'Camera feeds', value: 'The Home Camera face streams up to nine video feeds at once' },
          { label: 'Secure Video', value: 'End-to-end encrypted recognition of people, familiar faces, pets, packages and vehicles with a supported iCloud+ subscription, plus video descriptions' },
          { label: 'Accessories', value: 'Works with Apple Home and Matter accessories, and with Apple Home Collection cameras, thermostats and a door lock, which arrive later' },
          { label: 'Installation', value: 'The tabletop model needs no installation; ADT professional installation is available for the wall-mounted model in most areas' },
        ],
      },
      {
        group: 'Wireless, sensors and power',
        rows: [
          { label: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax) with MIMO, simultaneous dual band and peer-to-peer discovery' },
          { label: 'Bluetooth', value: 'Bluetooth 6.0' },
          { label: 'Thread', value: 'Thread networking technology' },
          { label: 'Sensors', value: 'Ambient light, temperature and humidity, and an accelerometer' },
          { label: 'Line voltage', value: '100V to 240V AC, 50Hz to 60Hz' },
          { label: 'Tabletop power', value: 'USB-C, with a 1.5 m cable and a 30W adapter included' },
          { label: 'Wall-mounted power', value: 'USB-C, with the mount, the cable and an adapter of at least 20W each sold separately' },
        ],
      },
      {
        group: 'Dimensions and weight',
        rows: [
          { label: 'Dimensions', value: 'See “Apple HomeView dimensions and size” in the guide below: both models, in inches and centimetres, in the order Apple lists them' },
          { label: 'Weight, tabletop', value: '2.1 pounds (952 grams)' },
          { label: 'Weight, wall mounted', value: '0.63 pound (286 grams)' },
          { label: 'Operating range', value: '32 to 95 degrees F (0 to 35 degrees C), 5% to 90% relative humidity, tested up to 10,000 feet' },
        ],
      },
      {
        group: 'Apps and accessibility',
        rows: [
          { label: 'Built-in apps', value: 'Alarms, Calendar, FaceTime, Find My, Home, Intercom, Messages, Music, Podcasts, Reminders, Safari, Settings, Timers, Weather and World Clock' },
          { label: 'Apps from iPhone', value: 'Audiobooks, Classical Music, News and TV' },
          { label: 'Third-party apps', value: 'Compatible third-party audio and video apps run from the paired iPhone; Apple\u2019s specification page lists no App Store' },
          { label: 'Recipes', value: 'Safari pages convert into step-by-step cooking instructions' },
          { label: 'Handoff', value: 'Start a song, podcast, call, video or recipe on iPhone and continue on HomeView' },
          { label: 'Accessibility', value: 'VoiceOver, Zoom, Voice Control, Switch Control, AssistiveTouch, Real-Time Text, Live Speech, Live Captions, Siri and Dictation, Type to Siri, Vocal Shortcuts, and subtitles and closed captioning' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Apple HomeView is not available for sale in the European Union, because Apple states Siri AI is currently unavailable in iOS in the EU.',
          'The wall-mounted model ships without a mount, a USB-C cable or a power adapter \u2014 Apple says each is sold separately and that the adapter must be at least 20W.',
          'Personal context needs an Apple Intelligence-enabled iPhone or iPad; Apple states Siri AI ships in beta in HomeView software version 27.2 and that usage limits may apply.',
          'Apple\u2019s specification page lists no memory or storage figure for either model, so this sheet publishes none.',
          'Apple lists no Ultra Wideband chip: the published wireless set is Wi-Fi 6E, Bluetooth 6.0 and Thread.',
          'Apple publishes no water or dust resistance rating for HomeView.',
          'Snoopy, Flow and Photos are Apple\u2019s own names for the faces; Apple has not published a complete face list.',
        ],
      },
    ],
  },

  // ── Standalone entries, batch 3 ───────────────────────────────────────────
  // No price, no rating, no review count: the owner supplies those by hand and
  // the page must never guess them. Specs come only from the makers' own pages,
  // recorded in specSource, and anything they do not publish stays out.
  'asus-vivobook-15-x1504va': {
    slug: 'asus-vivobook-15-x1504va',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$589.21',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'ASUS Vivobook 15 (X1504VA)',
    status: 'available',
    product: {
      name: 'ASUS Vivobook 15 (X1504VA)',
      category: 'Laptops & PCs',
      categorySlug: 'laptops',
      brand: 'ASUS',
      buyUrl: 'https://amzn.to/4yoTZQH',
      description:
        "ASUS's 15.6-inch everyday laptop in the X1504VA build: a full-HD anti-glare display, 13th Gen Intel Core U-series processors, 16 GB of DDR4 memory and a 42 Wh battery in a 1.70 kg chassis.",
      features: [
        '15.6-inch FHD anti-glare display at 250 nits and 60 Hz',
        '13th Gen Intel Core i3, i5 or i7 U-series processors',
        '16 GB of DDR4 memory, expandable to a 16 GB maximum',
        '512 GB or 1 TB M.2 NVMe SSD',
        'Wi-Fi 6 and Bluetooth 5.2, with USB-C, HDMI and three USB-A ports',
        '720p HD camera with a privacy shutter',
      ],
    },
    specSource:
      "ASUS's Vivobook 15 (X1504) technical-specifications page on asus.com, which lists the X1504VA build alongside its other X1504 models — checked in October 2026",
    metaDescription:
      'ASUS Vivobook 15 X1504VA spec sheet: a 15.6-inch FHD anti-glare display, 13th Gen Intel Core options, 16 GB DDR4, Wi-Fi 6 and a 42 Wh battery.',
    images: [
      '/product-images/asus-vivobook-15-x1504va-cool-silver.webp',
      '/product-images/asus-vivobook-15-x1504va-quiet-blue.webp',
      '/product-images/asus-vivobook-15-x1504va-terra-cotta.webp',
    ],
    imageAlts: [
      'ASUS Vivobook 15 X1504VA laptop in Cool Silver',
      'ASUS Vivobook 15 X1504VA laptop in Quiet Blue',
      'ASUS Vivobook 15 X1504VA laptop in Terra Cotta',
    ],
    highlights: [
      { label: 'Display', value: '15.6-inch FHD' },
      { label: 'Processor', value: '13th Gen Core' },
      { label: 'Memory', value: '16 GB DDR4' },
      { label: 'Storage', value: '512 GB or 1 TB' },
      { label: 'Weight', value: '1.70 kg' },
    ],
    keySpecs: [
      { label: 'Display', value: '15.6-inch FHD (1920 x 1080), 60 Hz, 250 nits, anti-glare' },
      {
        label: 'Processor',
        value: '13th Gen Intel Core i7-1355U, i5-1334U or i3-1315U, depending on the model',
      },
      { label: 'Memory', value: '16 GB DDR4, 16 GB maximum, one SO-DIMM slot' },
      { label: 'Storage', value: '512 GB or 1 TB M.2 NVMe PCIe 3.0 SSD' },
      { label: 'Graphics', value: 'Intel UHD Graphics; Iris Xe on some i5 and i7 builds' },
      { label: 'Wireless', value: 'Wi-Fi 6 (802.11ax) dual band and Bluetooth 5.2' },
      { label: 'Battery', value: '42 Wh, 3-cell lithium-ion' },
      { label: 'Weight', value: '1.70 kg (3.75 lb)' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'ASUS' },
      { label: 'Model', value: 'Vivobook 15 (X1504VA)' },
      { label: 'Operating system', value: 'Windows 11 Home' },
      { label: 'Colour in the reviewed build', value: 'Cool Silver' },
      { label: 'Camera', value: '720p HD with a privacy shutter' },
      {
        label: 'Keyboard',
        value: 'Chiclet keyboard with 1.4 mm key travel and a precision touchpad',
      },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '15.6 inches, 16:9' },
          { label: 'Resolution', value: 'FHD (1920 x 1080)' },
          { label: 'Panel', value: 'LED backlit, anti-glare, non-touch' },
          { label: 'Refresh rate', value: '60 Hz' },
          { label: 'Brightness', value: '250 nits' },
          { label: 'Colour gamut', value: '45% NTSC' },
          { label: 'Screen-to-body ratio', value: '84%' },
          { label: 'Certification', value: 'TUV Rheinland certified' },
        ],
      },
      {
        group: 'Performance and memory',
        rows: [
          {
            label: 'Processors ASUS lists',
            value: 'Intel Core i7-1355U, Core i5-1334U and Core i3-1315U',
          },
          { label: 'Graphics', value: 'Intel UHD Graphics' },
          {
            label: 'Iris Xe note from ASUS',
            value: 'Only on Core i5, i7 or i9 models with dual-channel memory',
          },
          { label: 'Memory', value: '16 GB DDR4 installed, 16 GB maximum' },
          { label: 'Memory slot', value: 'One DDR4 SO-DIMM slot' },
          { label: 'Storage', value: '512 GB or 1 TB M.2 NVMe PCIe 3.0 SSD' },
          { label: 'Expansion', value: 'One M.2 2280 PCIe 4.0 x4 slot' },
        ],
      },
      {
        group: 'Ports and connectivity',
        rows: [
          { label: 'USB-A', value: 'Two USB 3.2 Gen 1 (5 Gbps) and one USB 2.0' },
          { label: 'USB-C', value: 'One USB 3.2 Gen 1 (5 Gbps), data only' },
          { label: 'Video out', value: 'One HDMI 1.4' },
          { label: 'Audio', value: 'One 3.5 mm combo jack' },
          { label: 'Power', value: 'One DC-in barrel connector' },
          { label: 'Wi-Fi', value: 'Wi-Fi 6 (802.11ax), dual band, 1x1' },
          { label: 'Bluetooth', value: 'Bluetooth 5.2' },
        ],
      },
      {
        group: 'Audio, camera and keyboard',
        rows: [
          { label: 'Speakers', value: 'Built-in speakers with SonicMaster tuning' },
          { label: 'Microphone', value: 'Built-in array microphone' },
          { label: 'Camera', value: '720p HD camera with a privacy shutter' },
          { label: 'Keyboard', value: 'Chiclet keyboard, 1.4 mm key travel' },
          { label: 'Touchpad', value: 'Precision touchpad' },
        ],
      },
      {
        group: 'Power, size and weight',
        rows: [
          { label: 'Battery', value: '42 Wh, 3S1P, 3-cell lithium-ion' },
          {
            label: 'Adapter',
            value: '45 W, 19 V DC at 2.37 A, 100-240 V input',
          },
          { label: 'Dimensions', value: '35.97 x 23.25 x 1.79 cm' },
          { label: 'Weight', value: '1.70 kg (3.75 lb)' },
          { label: 'Operating system', value: 'Windows 11 Home' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'ASUS lists several X1504VA configurations, so the processor, memory and SSD depend on the exact model that is sold.',
          'The display is rated at 250 nits and 45% NTSC, which is an everyday panel rather than a colour-accurate one.',
          'The USB-C port carries data only on this build; ASUS lists no DisplayPort or charging over USB-C.',
          'ASUS states that whether a power adapter is included varies by country, region and model.',
          'The X1504VA column does not list a backlit keyboard, although other X1504 models do.',
        ],
      },
    ],
  },

  'lenovo-ideacentre-aio-27': {
    slug: 'lenovo-ideacentre-aio-27',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$559.99',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'Lenovo IdeaCentre AIO 27',
    status: 'available',
    product: {
      name: 'Lenovo IdeaCentre AIO 27-inch (27IRH9)',
      category: 'Laptops & PCs',
      categorySlug: 'laptops',
      brand: 'Lenovo',
      buyUrl: 'https://amzn.to/4yhHdn7',
      description:
        "Lenovo's 27-inch all-in-one desktop in the Intel 27IRH9 family: a 100 Hz full-HD IPS display, 13th Gen Intel Core processors, DDR5 memory, HARMAN stereo speakers and a 5 MP camera with a privacy shutter.",
      features: [
        '27-inch FHD IPS display at 100 Hz with 99% sRGB coverage',
        '13th Gen Intel Core processors, up to a Core i9-13900H',
        'Up to 32 GB of DDR5 memory in two SO-DIMM slots',
        'Up to 1 TB of M.2 PCIe 4.0 storage',
        'HARMAN stereo speakers at 3 W each, with a dual-microphone array',
        'Wi-Fi 6, Bluetooth 5.2, gigabit Ethernet and HDMI in and out',
      ],
    },
    specSource:
      "Lenovo's Product Specifications Reference (PSREF) document for the IdeaCentre AIO 27IRH9 on psref.lenovo.com, checked in October 2026",
    metaDescription:
      'Lenovo IdeaCentre AIO 27IRH9 spec sheet: a 27-inch FHD IPS display at 100 Hz, 13th Gen Intel Core options, DDR5 memory, HARMAN speakers and Wi-Fi 6.',
    images: [
      '/product-images/lenovo-ideacentre-aio-27-light-silver.webp',
      '/product-images/lenovo-ideacentre-aio-27-light-silver-front.webp',
      '/product-images/lenovo-ideacentre-aio-27-dark-grey.webp',
    ],
    imageAlts: [
      'Lenovo IdeaCentre AIO 27 all-in-one desktop with a silver-grey frame',
      'Lenovo IdeaCentre AIO 27 front view with its wireless keyboard and mouse',
      'Lenovo IdeaCentre AIO 27 all-in-one desktop with a dark grey frame',
    ],
    highlights: [
      { label: 'Display', value: '27-inch FHD IPS' },
      { label: 'Refresh rate', value: '100 Hz' },
      { label: 'Processor', value: '13th Gen Core' },
      { label: 'Memory', value: 'Up to 32 GB DDR5' },
      { label: 'Weight', value: 'From 7.1 kg' },
    ],
    keySpecs: [
      {
        label: 'Display',
        value: '27-inch FHD (1920 x 1080) IPS, 300 nits, 100 Hz, anti-glare',
      },
      {
        label: 'Processor',
        value: '13th Gen Intel Core i3-1315U up to Core i9-13900H, depending on the model',
      },
      { label: 'Memory', value: 'Up to 32 GB DDR5-5200 in two SO-DIMM slots' },
      { label: 'Storage', value: 'One M.2 2280 PCIe 4.0 x4 SSD, up to 1 TB' },
      { label: 'Graphics', value: 'Intel UHD Graphics or Intel Iris Xe, integrated' },
      { label: 'Audio', value: 'Stereo speakers at 3 W each, tuned by HARMAN' },
      { label: 'Camera', value: '5 MP, with a 5 MP IR camera and a shutter latch' },
      { label: 'Weight', value: 'Around 7.1 kg for FHD models' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Lenovo' },
      { label: 'Model family', value: 'IdeaCentre AIO 27IRH9' },
      { label: 'Operating system', value: 'Windows 11 Home or Windows 11 Pro' },
      { label: 'Colours', value: 'Cloud grey and Luna grey, per Lenovo' },
      { label: 'Stand', value: 'Tilt from -5 to +15 degrees' },
      { label: 'Wired network', value: 'Gigabit Ethernet (RJ-45)' },
      { label: 'Touchscreen', value: 'Available on some models, 10-point multi-touch' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '27 inches, 16:9' },
          { label: 'Resolution', value: 'FHD (1920 x 1080); QHD (2560 x 1440) on some models' },
          { label: 'Panel', value: 'IPS, anti-glare' },
          { label: 'Brightness', value: '300 nits on FHD, 350 nits on QHD' },
          { label: 'Refresh rate', value: '100 Hz' },
          { label: 'Colour gamut', value: '99% sRGB' },
          { label: 'Touch', value: '10-point multi-touch on touch models, non-touch otherwise' },
          { label: 'Certifications', value: 'TUV Rheinland Flicker Free and Low Blue Light' },
        ],
      },
      {
        group: 'Performance and memory',
        rows: [
          {
            label: 'Processors Lenovo lists',
            value: 'Core i3-1315U, Core i5-13420H, Core i7-13620H and Core i9-13900H',
          },
          { label: 'Chipset', value: 'Intel SoC platform' },
          { label: 'Memory', value: 'Up to 32 GB DDR5-5200' },
          { label: 'Memory slots', value: 'Two DDR5 SO-DIMM slots, dual-channel capable' },
          { label: 'Storage', value: 'One M.2 2280 SSD on PCIe 4.0 x4, up to 1 TB' },
          { label: 'Graphics', value: 'Integrated Intel UHD Graphics or Iris Xe' },
          { label: 'Monitor support', value: 'Up to two independent displays with one external monitor' },
        ],
      },
      {
        group: 'Audio, camera and input',
        rows: [
          { label: 'Speakers', value: 'Stereo, 3 W each, Audio by HARMAN' },
          { label: 'Audio codec', value: 'Realtek ALC233-CG' },
          { label: 'Microphones', value: 'Dual-microphone array' },
          { label: 'Camera', value: '5 MP, or 5 MP IR, with a camera shutter latch' },
          {
            label: 'Keyboard and mouse',
            value: 'Wired or wireless sets on some models; Lenovo lists configurations without them',
          },
        ],
      },
      {
        group: 'Ports and connectivity',
        rows: [
          { label: 'Rear USB-A', value: 'One at 10 Gbps and two at USB 2.0' },
          { label: 'USB-C', value: 'One at 10 Gbps on the left, data transfer only' },
          { label: 'HDMI in', value: 'One HDMI 1.4' },
          { label: 'HDMI out', value: 'One HDMI 2.1 TMDS' },
          { label: 'Ethernet', value: 'Gigabit RJ-45' },
          { label: 'Audio port', value: 'One 3.5 mm headphone and microphone combo jack' },
          { label: 'Wi-Fi', value: 'Wi-Fi 6 (802.11ax), 2x2' },
          { label: 'Bluetooth', value: 'Bluetooth 5.2' },
        ],
      },
      {
        group: 'Power, size and weight',
        rows: [
          { label: 'Power supply', value: '90 W or 135 W adapter, autosensing' },
          {
            label: 'Dimensions, FHD',
            value: '611.72 x 192 x 473.16 mm (24.08 x 7.55 x 18.62 in)',
          },
          {
            label: 'Dimensions, QHD',
            value: '613.3 x 192.1 x 472.38 mm (24.15 x 7.56 x 18.59 in)',
          },
          { label: 'Weight, FHD', value: 'Around 7.1 kg (15.65 lb)' },
          { label: 'Weight, QHD', value: 'Around 7.51 kg (16.55 lb)' },
          { label: 'Operating system', value: 'Windows 11 Home or Windows 11 Pro' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Lenovo sells 27-inch IdeaCentre AIO desktops in more than one family; this sheet covers the Intel 27IRH9, whose full specifications Lenovo publishes.',
          'The USB-C port is data transfer only, so it cannot drive a monitor or charge the desktop.',
          'The base does not tilt backwards past 15 degrees and there is no height adjustment.',
          'Lenovo lists keyboard and mouse as configuration options, and some models ship without either.',
          'Display resolution and touch depend on the model: 1920 x 1080 or 2560 x 1440, touch or non-touch.',
        ],
      },
    ],
  },

  'xiaomi-redmi-watch-5': {
    slug: 'xiaomi-redmi-watch-5',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$43.49',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'Xiaomi Redmi Watch 5',
    status: 'available',
    product: {
      name: 'Xiaomi Redmi Watch 5',
      category: 'Audio & Wearables',
      categorySlug: 'audio-wearables',
      brand: 'Xiaomi',
      buyUrl: 'https://amzn.to/4yOFF4P',
      description:
        "Xiaomi's Redmi Watch 5: a 2.07-inch square AMOLED display at 432 x 514, a 550 mAh battery rated at 24 days of typical use, 5ATM water resistance, built-in five-system GNSS and Bluetooth calling.",
      features: [
        '2.07-inch square AMOLED display at 432 x 514, 324 ppi and 1500 nits of peak brightness',
        '550 mAh battery, rated by Xiaomi at up to 24 days of typical use',
        '5ATM water resistance, rated for 18 water sports',
        'Built-in five-system GNSS, so outdoor workouts track without a phone',
        'Bluetooth 5.3 calling with two microphones and wind-noise resistance',
        '150+ sports modes and 200+ watch faces, running Xiaomi HyperOS',
      ],
    },
    specSource:
      "Xiaomi's Redmi Watch 5 overview and specifications pages on mi.com/global, checked in October 2026",
    metaDescription:
      'Redmi Watch 5 spec sheet: the 2.07-inch AMOLED display, the 550 mAh battery Xiaomi rates at 24 days, 5ATM water resistance and built-in five-system GNSS.',
    images: [
      '/product-images/xiaomi-redmi-watch-5-obsidian-black.webp',
      '/product-images/xiaomi-redmi-watch-5-silver-gray.webp',
      '/product-images/xiaomi-redmi-watch-5-lavender-purple.webp',
    ],
    imageAlts: [
      'Xiaomi Redmi Watch 5 in Obsidian Black, on a slate stand beside a plant',
      'Xiaomi Redmi Watch 5 in Silver Gray, angled to show the crown and strap',
      'Xiaomi Redmi Watch 5 in Lavender Purple, three-quarter view of the display',
    ],
    highlights: [
      { label: 'Display', value: '2.07-inch AMOLED' },
      { label: 'Brightness', value: '1500 nits' },
      { label: 'Battery', value: '550 mAh' },
      { label: 'Battery life', value: '24 days typical' },
      { label: 'Water resistance', value: '5ATM' },
    ],
    keySpecs: [
      {
        label: 'Display',
        value: '2.07-inch square AMOLED, 432 x 514, 324 ppi, 60 Hz, 1500 nits HBM',
      },
      { label: 'Battery', value: '550 mAh, 24 days of typical use per Xiaomi' },
      { label: 'Water resistance', value: '5ATM, rated for 18 water sports' },
      {
        label: 'Positioning',
        value: 'Built-in GNSS: GPS, Galileo, GLONASS, BeiDou and QZSS',
      },
      { label: 'Calling', value: 'Bluetooth 5.3, speaker and 2 microphones' },
      { label: 'Case', value: 'Aluminium alloy frame, 47.5 x 41.1 x 11.3 mm' },
      { label: 'Weight', value: '33.5 g without the strap' },
      { label: 'Storage', value: '164 MB available for local use' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Xiaomi' },
      { label: 'Model', value: 'Redmi Watch 5' },
      { label: 'Operating system', value: 'Xiaomi HyperOS' },
      {
        label: 'Compatibility',
        value: 'Phones on Android 8.0 and above, or iOS 12.0 and above',
      },
      { label: 'Strap', value: 'TPU, 135-205 mm, with a quick-release fitting' },
      { label: 'Crown', value: 'Stainless-steel rotating crown' },
      {
        label: 'In the box',
        value: 'Watch, magnetic charging cable and user manual including the warranty notice',
      },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Size', value: '2.07 inches, square' },
          { label: 'Panel', value: 'AMOLED' },
          { label: 'Resolution', value: '432 x 514 pixels' },
          { label: 'Pixel density', value: '324 ppi' },
          { label: 'Refresh rate', value: '60 Hz' },
          { label: 'Brightness', value: '1500 nits HBM' },
          { label: 'Screen-to-body ratio', value: '82%' },
          { label: 'Glass', value: '2.5D curved' },
        ],
      },
      {
        group: 'Design and build',
        rows: [
          { label: 'Dimensions', value: '47.5 x 41.1 x 11.3 mm, excluding the strap and protrusions' },
          { label: 'Weight', value: '33.5 g approx., without the in-box strap' },
          { label: 'Frame', value: 'Aluminium alloy middle frame' },
          { label: 'Crown', value: 'Stainless steel, sandblasted and diamond-cut' },
          { label: 'Strap', value: 'TPU, 135-205 mm approx.' },
          { label: 'Strap colours', value: 'Obsidian Black, Silver Gray and Lavender Purple' },
          { label: 'Water resistance', value: '5ATM' },
        ],
      },
      {
        group: 'Health and sensors',
        rows: [
          { label: 'Heart rate', value: 'Heart rate sensor with a blood oxygen sensor' },
          { label: 'Motion', value: 'Accelerometer and gyroscope' },
          { label: 'Light', value: 'Ambient light sensor' },
          { label: 'Compass', value: 'Electronic compass' },
          { label: 'Tracking Xiaomi lists', value: 'All-day heart rate, blood oxygen, sleep and stress monitoring' },
          { label: 'Vitality score', value: 'Included, as one of the health readings' },
        ],
      },
      {
        group: 'Positioning and training',
        rows: [
          {
            label: 'Satellite systems',
            value: 'GPS, Galileo, GLONASS, BeiDou and QZSS',
          },
          { label: 'Sports modes', value: '150+ per Xiaomi' },
          { label: 'Water sports', value: '18, under the 5ATM rating' },
          { label: 'Running courses', value: '10 on-wrist courses' },
          { label: 'Breathing exercises', value: 'Relax, Concentrate, Take a nap and Sleep soundly' },
        ],
      },
      {
        group: 'Battery, memory and connectivity',
        rows: [
          { label: 'Capacity', value: '550 mAh' },
          { label: 'Battery life', value: '24 days in typical usage mode, per Xiaomi' },
          { label: 'Charging', value: 'Magnetic charging cable, supplied in the box' },
          { label: 'Bluetooth', value: 'Bluetooth 5.3' },
          { label: 'Calling', value: 'Bluetooth calling through the paired phone' },
          { label: 'Microphones', value: '2, with wind-noise resistance' },
          { label: 'Speaker', value: 'Built in' },
          { label: 'Local storage', value: '164 MB available' },
          { label: 'Operating system', value: 'Xiaomi HyperOS' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'The specification page lists a single 24-day figure for typical usage and no separate heavy-use figure for this model.',
          'Xiaomi states that the watch must stay connected to the phone over Bluetooth and that voice calls from third-party apps are not supported.',
          'Xiaomi does not publish a charging time for this model on its specification page.',
          'No Wi-Fi or cellular connection is listed, so the watch depends on the paired phone for anything online.',
          'Xiaomi states the product and its features are not designed for medical purposes.',
        ],
      },
    ],
  },

  'anker-soundcore-r50i': {
    slug: 'anker-soundcore-r50i',
    displayName: 'Anker Soundcore R50i',
    status: 'available',
    product: {
      name: 'Anker Soundcore R50i',
      category: 'Audio & Wearables',
      categorySlug: 'audio-wearables',
      brand: 'Anker',
      buyUrl: 'https://amzn.to/47TXP9y',
      description:
        "Anker's soundcore R50i true-wireless earbuds: 10 mm drivers, Bluetooth 5.3, IPX5 water resistance, two microphones for calls, and 10 hours of playback per charge with a case that takes it to 30.",
      features: [
        '10 mm drivers with soundcore bass tuning',
        '10 hours of playback per charge, 30 hours with the charging case',
        'A 10-minute charge gives 2 hours of playback',
        'Bluetooth 5.3, with a single-earbud mode',
        'IPX5 water resistance',
        'Two microphones with an AI algorithm for calls, and 22 EQ presets in the app',
      ],
    },
    specSource:
      "Anker's soundcore P20i product page on soundcore.com, plus the official P20i / R50i / P25i (A3949) user guide on service.soundcore.com, checked in October 2026",
    metaDescription:
      'Soundcore R50i spec sheet: 10 mm drivers, Bluetooth 5.3, IPX5 water resistance, 10 hours per charge and 30 hours with the charging case, plus 22 EQ presets.',
    images: [
      '/product-images/soundcore-r50i-black.webp',
      '/product-images/soundcore-r50i-navy-blue.webp',
      '/product-images/soundcore-r50i-white.webp',
    ],
    imageAlts: [
      'Anker Soundcore R50i earbuds above their black charging case, with the lanyard',
      'Anker Soundcore R50i earbuds and navy blue charging case on a stone surface',
      'Anker Soundcore R50i earbuds and white charging case, with the lanyard coiled',
    ],
    highlights: [
      { label: 'Drivers', value: '10 mm' },
      { label: 'Playtime', value: '10 h, 30 h with case' },
      { label: 'Bluetooth', value: '5.3' },
      { label: 'Water resistance', value: 'IPX5' },
      { label: 'Microphones', value: '2, AI calls' },
    ],
    keySpecs: [
      { label: 'Drivers', value: '10 mm dynamic, one per earbud' },
      { label: 'Playtime', value: '10 hours per charge, 30 hours with the case' },
      { label: 'Fast charge', value: '10 minutes for 2 hours of playback' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3' },
      { label: 'Water resistance', value: 'IPX5' },
      { label: 'Microphones', value: '2, with an AI algorithm for calls' },
      { label: 'App', value: '22 EQ presets, tap-control remapping and Find My Earbuds' },
      { label: 'Design', value: 'In-ear, with a lanyard on the charging case' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Anker' },
      { label: 'Series', value: 'soundcore' },
      { label: 'Model', value: 'R50i (A3949), also sold as the soundcore P20i' },
      { label: 'Type', value: 'True wireless in-ear earbuds' },
      { label: 'Noise cancellation', value: 'None listed for this model; the R50i NC is a separate product' },
      { label: 'Colours in the gallery', value: 'Black, navy blue and white' },
      {
        label: 'Case',
        value: 'Charging case with a lanyard attached',
      },
    ],
    specs: [
      {
        group: 'Audio',
        rows: [
          { label: 'Drivers', value: '10 mm, one per earbud' },
          { label: 'Tuning', value: 'soundcore bass tuning, with BassUp among the presets' },
          { label: 'EQ', value: '22 preset equalisers in the soundcore app' },
          { label: 'Gaming mode', value: 'Available through the app, to lower in-game audio delay' },
          { label: 'Single earbud mode', value: 'Yes, for one-ear listening or extra playtime' },
        ],
      },
      {
        group: 'Battery and charging',
        rows: [
          { label: 'Playtime, earbuds', value: '10 hours on a single charge' },
          { label: 'Playtime, with case', value: '30 hours total' },
          { label: 'Fast charge', value: '10 minutes for 2 hours of playback' },
        ],
      },
      {
        group: 'Calls and connectivity',
        rows: [
          { label: 'Bluetooth', value: 'Bluetooth 5.3' },
          { label: 'Microphones', value: '2 built-in, with an AI algorithm for voice pickup' },
          { label: 'Controls', value: 'Tap controls, remappable in the soundcore app' },
        ],
      },
      {
        group: 'Build',
        rows: [
          { label: 'Water resistance', value: 'IPX5' },
          { label: 'Form', value: 'In-ear, with silicone tips' },
          { label: 'Case', value: 'Charging case with an attached lanyard' },
          { label: 'Colours', value: 'Black, navy blue and white' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'soundcore lists no active noise cancellation for the R50i; that feature belongs to the separate R50i NC.',
          'The 30-hour figure includes the charging case; a single charge is rated at 10 hours.',
          'The IPX5 rating covers water jets, and soundcore publishes no dust rating for these earbuds.',
          'soundcore does not publish driver impedance, frequency response or codec support on the product page reviewed.',
          'The earbuds are not rated for swimming, and no in-box list is published on the product page reviewed.',
        ],
      },
    ],
  },

  // ── Batch 4: linked entries ───────────────────────────────────────────────
  // These four slugs already exist in src/data/products.ts, so they carry no
  // `product` block: the record supplies the name, category, price, rating and
  // buy link, and only the spec sheet is added here. Nothing in the catalog was
  // edited for them.
  'samsung-galaxy-z-fold7-256gb': {
    slug: 'samsung-galaxy-z-fold7-256gb',
    // Priced per storage variant: no single headline amount, one row each.
    priceBox: {
      label: 'Prices by storage',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
      rows: [
        { label: '256GB', amount: '$1,999.99' },
        { label: '512GB', amount: '$2,199.99' },
        { label: '1TB', amount: '$2,499.99' },
      ],
    },
    displayName: 'Samsung Galaxy Z Fold7',
    status: 'available',
    // Everything below is stated on Samsung's own Galaxy Z Fold7 pages. The
    // pages reviewed publish no display resolution, no charging wattage and no
    // Wi-Fi, Bluetooth, NFC or UWB detail, so none of those appears here.
    specSource:
      "Samsung's Galaxy Z Fold7 product page and Galaxy Z Fold7 comparison page on samsung.com (US), both checked in October 2026",
    metaDescription:
      'Galaxy Z Fold7 spec sheet: an 8.0-inch 120 Hz main screen, a 6.5-inch cover display, a 200 MP camera, Snapdragon 8 Elite and a 4,400 mAh battery.',
    highlights: [
      { label: 'Main screen', value: '8.0 inches' },
      { label: 'Cover screen', value: '6.5 inches' },
      { label: 'Rear camera', value: '200 MP wide' },
      { label: 'Processor', value: 'Snapdragon 8 Elite' },
      { label: 'Weight', value: '215 g' },
    ],
    keySpecs: [
      { label: 'Main display', value: '8.0-inch Dynamic AMOLED 2X, 1–120 Hz, up to 2,600 nits' },
      { label: 'Cover display', value: '6.5-inch Dynamic AMOLED 2X, 21:9, 1–120 Hz, up to 2,600 nits' },
      { label: 'Processor', value: 'Snapdragon 8 Elite, customized for Galaxy' },
      { label: 'Memory', value: '12 GB or 16 GB' },
      { label: 'Storage', value: '256 GB, 512 GB or 1 TB' },
      { label: 'Rear cameras', value: '200 MP wide, 12 MP ultra wide, 10 MP telephoto (3x optical)' },
      { label: 'Battery', value: '4,400 mAh typical (4,272 mAh rated)' },
      { label: 'Weight', value: '215 g' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Samsung' },
      { label: 'Series', value: 'Galaxy Z Fold' },
      { label: 'Form', value: 'Book-style foldable, one main screen and one cover screen' },
      { label: 'Software', value: 'One UI 8, with Galaxy AI' },
      { label: 'Durability', value: 'IP48 water and dust resistance' },
      { label: 'S Pen', value: 'Not supported' },
      { label: 'Colours', value: 'Blue Shadow, Silver Shadow, Jetblack, plus Mint on Samsung.com' },
    ],
    specs: [
      {
        group: 'Display',
        rows: [
          { label: 'Main screen', value: '8.0 inches, measured diagonally' },
          { label: 'Cover screen', value: '6.5 inches, measured diagonally, 21:9 aspect ratio' },
          { label: 'Panel', value: 'Dynamic AMOLED 2X on both screens' },
          { label: 'Refresh rate', value: '1–120 Hz Adaptive Refresh Rate on both screens' },
          { label: 'Brightness', value: 'Up to 2,600 nits maximum' },
        ],
      },
      {
        group: 'Performance and storage',
        rows: [
          { label: 'Processor', value: 'Snapdragon 8 Elite for Galaxy' },
          { label: 'Samsung performance claim', value: '38% faster processing, 26% smoother graphics and 41% quicker AI than Galaxy Z Fold6, according to Samsung' },
          { label: 'Memory', value: '12 GB or 16 GB' },
          { label: 'Storage', value: '256 GB, 512 GB or 1 TB' },
          { label: 'Storage note', value: 'Samsung states memory and storage options may vary by country or carrier' },
        ],
      },
      {
        group: 'Cameras',
        rows: [
          { label: 'Wide', value: '200 MP, with 2x Optical Quality Zoom' },
          { label: 'Ultra wide', value: '12 MP' },
          { label: 'Telephoto', value: '10 MP, 3x optical zoom' },
          { label: 'Cover screen camera', value: '10 MP' },
          { label: 'Main screen camera', value: '10 MP, 100-degree field of view' },
        ],
      },
      {
        group: 'Battery and build',
        rows: [
          { label: 'Battery capacity', value: '4,400 mAh typical; 4,272 mAh rated' },
          { label: 'Samsung playback claim', value: 'Up to 24 hours of video playback' },
          { label: 'Thickness, folded', value: '8.9 mm' },
          { label: 'Thickness, unfolded', value: '4.2 mm' },
          { label: 'Weight', value: '215 g' },
          { label: 'Frame', value: 'Advanced Armor Aluminum, with the Armor FlexHinge' },
          { label: 'Glass', value: 'Corning Gorilla Glass Ceramic 2 on the front, Gorilla Glass Victus 2 on the rear' },
          { label: 'Water and dust resistance', value: 'IP48' },
        ],
      },
      {
        group: 'Software',
        rows: [
          { label: 'Interface', value: 'One UI 8' },
          { label: 'Galaxy AI', value: 'Photo Assist, Audio Eraser, Now Brief and Gemini Live screen sharing' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Samsung does not publish a display resolution for either screen on the product and comparison pages reviewed, so no pixel figure is given here.',
          'Samsung does not state a charging wattage for this model on those pages.',
          'Galaxy Z Fold7 does not support the S Pen, Samsung states.',
          'The pages reviewed list no Wi-Fi, Bluetooth, NFC or UWB specification.',
          'Samsung notes that memory and storage options, and colour availability, may vary by country or carrier.',
        ],
      },
    ],
  },

  'playstation-5-disc-console-slim': {
    slug: 'playstation-5-disc-console-slim',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$649.00',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'PlayStation 5 Slim',
    status: 'available',
    // Sony's slim-console specification list, published with the new model. The
    // list covers the disc-drive console; the Digital Edition figures differ and
    // are noted only where Sony gives them. Sony publishes no Bluetooth version
    // or power-consumption figure for either model.
    specSource:
      "Sony Interactive Entertainment's PlayStation.Blog announcement of the slimmer PS5 (10 October 2023), which carries the console's published specification list, checked in October 2026",
    metaDescription:
      'PS5 Slim spec sheet: a 1 TB SSD, 16 GB of GDDR6 memory, a 4K 120 Hz HDMI 2.1 output, an Ultra HD Blu-ray disc drive and a 358 mm-wide chassis.',
    images: [
      '/product-images/playstation-5-slim-console-dualsense-front.webp',
      '/product-images/playstation-5-slim-console-vertical-blue.webp',
    ],
    imageAlts: [
      'PlayStation 5 Slim disc console beside a DualSense controller, with the vertical stand note',
      'PlayStation 5 Slim disc console and a DualSense controller on a plain grey background',
      'PlayStation 5 Slim disc console seen at an angle against a blue background',
    ],
    highlights: [
      { label: 'Storage', value: '1 TB SSD' },
      { label: 'Memory', value: '16 GB GDDR6' },
      { label: 'Graphics', value: '10.3 TFLOPS' },
      { label: 'Video out', value: '4K 120 Hz' },
      { label: 'Weight', value: '3.2 kg' },
    ],
    keySpecs: [
      { label: 'CPU', value: 'AMD Ryzen Zen 2, 8 cores / 16 threads, up to 3.5 GHz' },
      { label: 'GPU', value: 'AMD Radeon RDNA 2, up to 2.23 GHz, 10.3 TFLOPS' },
      { label: 'Memory', value: '16 GB GDDR6 at 448 GB/s' },
      { label: 'Storage', value: '1 TB SSD, 5.5 GB/s raw read' },
      { label: 'Disc drive', value: 'Ultra HD Blu-ray, up to 100 GB per disc; BD and DVD' },
      { label: 'Video output', value: '4K 120 Hz, 8K and VRR over HDMI 2.1' },
      { label: 'Dimensions', value: 'Approx. 358 x 96 x 216 mm (W x H x D)' },
      { label: 'Weight', value: 'Approx. 3.2 kg' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Sony' },
      { label: 'Family', value: 'PlayStation 5' },
      { label: 'Model type', value: 'Slim console with a disc drive' },
      { label: 'Audio', value: 'Tempest 3D AudioTech' },
      { label: 'Networking', value: 'Ethernet (10/100/1000) and IEEE 802.11 a/b/g/n/ac/ax Wi-Fi' },
      { label: 'Stand', value: 'Sony sells the vertical stand separately' },
      { label: 'Digital Edition difference', value: 'Approx. 358 x 80 x 216 mm and 2.6 kg, with no disc drive' },
    ],
    specs: [
      {
        group: 'Processing',
        rows: [
          { label: 'CPU', value: 'x86-64 AMD Ryzen Zen 2, 8 cores / 16 threads, variable frequency up to 3.5 GHz' },
          { label: 'GPU', value: 'AMD Radeon RDNA 2-based engine with ray-tracing acceleration, up to 2.23 GHz' },
          { label: 'GPU compute', value: '10.3 TFLOPS' },
          { label: 'System memory', value: '16 GB GDDR6, 448 GB/s bandwidth' },
        ],
      },
      {
        group: 'Storage and media',
        rows: [
          { label: 'Internal storage', value: '1 TB SSD' },
          { label: 'SSD read bandwidth', value: '5.5 GB/s raw' },
          { label: 'Disc drive', value: 'Disc Drive port equipped with a disc drive' },
          { label: 'Disc formats', value: 'Ultra HD Blu-ray up to 100 GB per disc, plus BD and DVD' },
        ],
      },
      {
        group: 'Video and audio',
        rows: [
          { label: 'Video out', value: '4K 120 Hz TVs, 8K TVs and VRR, specified by HDMI 2.1' },
          { label: 'Audio', value: 'Tempest 3D AudioTech' },
        ],
      },
      {
        group: 'Ports and networking',
        rows: [
          { label: 'Front ports', value: 'USB-C SuperSpeed 10 Gbps and USB-C Hi-Speed' },
          { label: 'Rear ports', value: 'Two USB-A SuperSpeed 10 Gbps' },
          { label: 'Ethernet', value: '10BASE-T, 100BASE-TX, 1000BASE-T' },
          { label: 'Wi-Fi', value: 'IEEE 802.11 a/b/g/n/ac/ax' },
        ],
      },
      {
        group: 'Size, weight and power',
        rows: [
          { label: 'Dimensions', value: 'Approx. 358 x 96 x 216 mm (width x height x depth), excluding projecting parts' },
          { label: 'Weight', value: 'Approx. 3.2 kg' },
          { label: 'Colour panels', value: 'Four separate cover panels, glossy on top and matte below' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Sony publishes no Bluetooth version and no power-consumption figure in the specification list reviewed.',
          'Sony\u2019s console specification and its later USB ports guide describe different front-port layouts, and Sony says the design varies by model, so check the exact revision being sold.',
          'The vertical stand is sold separately; Sony\u2019s own product image carries that note.',
          'The disc drive is what separates this model from the Digital Edition, which Sony lists at 80 mm tall and 2.6 kg.',
        ],
      },
    ],
  },

  'ugreen-usb-c-hub-5-in-1': {
    slug: 'ugreen-usb-c-hub-5-in-1',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$13.29',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'UGREEN USB-C Hub 5-in-1',
    status: 'available',
    // UGREEN's Revodok 105 page (SKU 15495). The port speeds below are quoted
    // from UGREEN's own port list, which is more specific than the catalog
    // record's short description and does not contradict it.
    specSource:
      "UGREEN's Revodok 105 5-in-1 USB-C Hub product pages for SKU 15495 on ugreen.com and us.ugreen.com, checked in October 2026",
    metaDescription:
      'UGREEN 5-in-1 hub spec sheet: 4K 30 Hz HDMI, 100 W USB-C power delivery, one 5 Gbps USB-A port, two USB 2.0 ports and a 20 cm built-in cable.',
    images: ['/product-images/ugreen-usb-c-hub-5-in-1-front-ports.webp'],
    imageAlts: [
      'UGREEN USB-C hub with its cable and a group of connected adapters',
      'UGREEN 5-in-1 USB-C hub showing its HDMI, USB-C and USB-A ports',
    ],
    highlights: [
      { label: 'Ports', value: '5' },
      { label: 'HDMI', value: '4K at 30 Hz' },
      { label: 'Power delivery', value: 'Up to 100 W' },
      { label: 'USB-A', value: '1 at 5 Gbps, 2 at 480 Mbps' },
      { label: 'Weight', value: '58 g' },
    ],
    keySpecs: [
      { label: 'HDMI', value: 'Up to 4K at 30 Hz' },
      { label: 'USB-C PD', value: 'Up to 100 W, with 95 W passed through to the laptop' },
      { label: 'USB-A 3.0', value: 'One port at up to 5 Gbps, data only' },
      { label: 'USB-A 2.0', value: 'Two ports at up to 480 Mbps, data only' },
      { label: 'Housing', value: 'Aluminium, CNC machined' },
      { label: 'Cable', value: 'Built-in USB-C cable, 20 cm' },
      { label: 'Weight', value: '58 g' },
      { label: 'Systems', value: 'Windows, macOS and Linux' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'UGREEN' },
      { label: 'Model', value: 'Revodok 105, SKU 15495' },
      { label: 'Type', value: 'USB-C hub with a built-in cable' },
      { label: 'Colour', value: 'Silver' },
      { label: 'Connection', value: 'Plug and play, no driver listed' },
      { label: 'Host requirement', value: 'The host USB-C port must support video output for HDMI' },
    ],
    specs: [
      {
        group: 'Ports',
        rows: [
          { label: 'HDMI', value: 'One, up to 4K at 30 Hz' },
          { label: 'USB-C PD', value: 'One, up to 100 W input' },
          { label: 'USB-A 3.0', value: 'One, up to 5 Gbps' },
          { label: 'USB-A 2.0', value: 'Two, up to 480 Mbps' },
        ],
      },
      {
        group: 'Power',
        rows: [
          { label: 'Power delivery', value: 'Up to 100 W into the hub' },
          { label: 'Pass-through to host', value: 'Up to 95 W; UGREEN reserves 5 W for the other ports' },
          { label: 'Charging over the USB-A ports', value: 'Not recommended by UGREEN' },
        ],
      },
      {
        group: 'Display',
        rows: [
          { label: 'Maximum resolution', value: '4K at 30 Hz through HDMI' },
          { label: 'Host requirement', value: 'The USB-C port on the host device must support video output' },
          { label: 'HDMI version', value: 'Not stated by UGREEN' },
        ],
      },
      {
        group: 'Build',
        rows: [
          { label: 'Housing', value: 'Aluminium with CNC machining' },
          { label: 'Built-in cable', value: '20 cm' },
          { label: 'Weight', value: '58 g' },
          { label: 'Colour', value: 'Silver' },
        ],
      },
      {
        group: 'Compatibility',
        rows: [
          { label: 'Operating systems', value: 'Windows, macOS, Linux' },
          { label: 'Devices UGREEN lists', value: 'MacBook Pro and Air, iMac, iPad Pro, Chromebook, Surface, XPS, ThinkPad, iPhone 15 and 16, Galaxy S24 and S25 Ultra, Pixel 8' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'The HDMI output is capped at 30 Hz, so it is not a high-refresh display connection.',
          'UGREEN does not state which HDMI version the port uses.',
          'There is no Ethernet, card reader or audio jack on this hub.',
          'The USB-A ports are for data only, and UGREEN advises against charging through them.',
          'UGREEN does not publish the hub\u2019s dimensions on the product pages reviewed.',
        ],
      },
    ],
  },

  'nintendo-switch-2-console': {
    slug: 'nintendo-switch-2-console',
    displayName: 'Nintendo Switch 2',
    status: 'available',
    // INFORMATIONAL (memory.md rule 4e): this store does not stock the console,
    // has no catalog record for it and sits on no verified price, so the page
    // renders a spec sheet and a guide with no purchase panel at all — no store
    // button, no price note, no affiliate disclosure. The owner's supplied
    // Amazon short link was verified before use on 2026-10-27 and resolved to a
    // third-party Switch 2 controller rather than the console, so no buy button
    // ships on this page until a console or bundle listing is confirmed.
    informational: true,
    product: {
      name: 'Nintendo Switch 2',
      category: 'Gaming Gear',
      categorySlug: 'gaming',
      brand: 'Nintendo',
      // The page's own content date: a standalone entry has no catalog record to
      // carry `addedAt`, and the sitemap reads it from here for its `lastmod`.
      addedAt: '2026-10-27',
      description:
        'Nintendo’s current console: a 7.9-inch 1080p LCD handheld that drops into an included dock for up to 4K output on a TV, with 256 GB of internal storage, magnetically attached Joy-Con 2 controllers and GameChat on the C button. It released on June 5, 2025 and is sold as a system on its own, as system-and-game bundles and as a themed 40th Anniversary Edition, all with the same hardware.',
      features: [
        '7.9-inch wide color gamut LCD at 1920 × 1080, with HDR10 and VRR up to 120 Hz',
        'Docks for TV output up to 3840 × 2160 (4K) at 60 fps, with a LAN port and two USB ports',
        'Joy-Con 2 controllers attach magnetically and work as mice in compatible games',
        '256 GB of internal UFS storage, expandable with microSD Express cards up to 2 TB',
        'GameChat from the C button, with audio for up to 12 people and video for up to four',
        'The game card slot takes both Nintendo Switch 2 and Nintendo Switch game cards',
      ],
      altText:
        'Nintendo Switch 2 console in its dock with Joy-Con 2 controllers attached, render',
    },
    // The gallery note under the hero image. It lives on the entry rather than
    // in the component so a second informational page cannot inherit Apple’s
    // announcement date by accident.
    illustrationNote:
      'The images above are illustrations of the Nintendo Switch 2 system, not photographs of a retail unit.',
    metaTitle: 'Nintendo Switch 2 Specs, Bundles & Buying Guide',
    metaDescription:
      'Nintendo Switch 2 specs, screen, storage, Joy-Con 2, dock and what each bundle includes, checked against Nintendo’s own pages.',
    // Position-matched to `images` below and written while looking at each file.
    // They are illustrations rather than Nintendo photographs, so the wording
    // says “render” and names only what each picture shows.
    imageAlts: [
      'Nintendo Switch 2 in its dock with Joy-Con 2 controllers attached, render',
      'Nintendo Switch 2 retail box showing the console, the dock and its controllers, render',
      'Nintendo Switch 2 in tabletop mode on its kickstand, both Joy-Con 2 detached, render',
      'Nintendo Switch 2 box, dock, Joy-Con 2 grip and cables laid out below a TV, render',
    ],
    images: [
      '/product-images/nintendo-switch-2-docked-console.webp',
      '/product-images/nintendo-switch-2-retail-box.webp',
      '/product-images/nintendo-switch-2-tabletop-mode.webp',
      '/product-images/nintendo-switch-2-box-contents.webp',
    ],
    highlights: [
      { label: 'Screen', value: '7.9-inch 1080p LCD' },
      { label: 'TV output', value: 'Up to 4K at 60 fps' },
      { label: 'Storage', value: '256 GB (UFS)' },
      { label: 'Battery', value: '2 – 6.5 hours' },
      { label: 'Controllers', value: 'Joy-Con 2' },
      { label: 'Released', value: 'June 5, 2025' },
    ],
    // The chips describe the current systems and bundles Nintendo lists, and they
    // are informational only: this entry carries no variantImages map, so
    // selecting one leaves the gallery exactly as it is.
    variants: [
      {
        label: 'Model',
        // One caption for the whole dimension, because every option is the same
        // console: the choice is the game download or the design, not hardware.
        note: 'Same console and the same accessories in every option. The bundles differ by the game download they include, and the 40th Anniversary Edition is a themed system with no game.',
        options: [
          {
            label: 'Nintendo Switch 2',
            note: 'System only: the console and the standard accessory list',
          },
          {
            label: 'Switch 2 + Mario Kart World Bundle',
            note: 'Adds a full Mario Kart World download and a code for three months of Nintendo Switch Online',
          },
          {
            label: 'Switch 2: Choose Your Game Bundle',
            note: 'Adds a “Choose One” download code insert, redeemed for one game from Nintendo’s list',
          },
          {
            label: 'Switch 2 + Nintendo Switch Sports Resort Bundle',
            note: 'Adds a Nintendo Switch Sports Resort download and a code for three months of Nintendo Switch Online',
          },
          {
            label: 'Switch 2 – Zelda 40th Anniversary Edition',
            note: 'Themed black and gold dock with green and gold Joy-Con 2; Nintendo states no game is included',
          },
        ],
      },
    ],
    // Nintendo's own pages only. Every row below was read on one of them on
    // October 27, 2026; nothing is carried over from reporting or from memory.
    specSource:
      "Nintendo's Switch 2 technical-specifications, product and features pages, the Nintendo Store listings for the system and for the Mario Kart World, Choose Your Game, Nintendo Switch Sports Resort and Legend of Zelda 40th Anniversary Edition releases, Nintendo's Switch 2 FAQ, and Nintendo Support articles on the differences between Switch 2 and Switch and on the console diagram — all read on nintendo.com and en-americas-support.nintendo.com on October 27, 2026",
    keySpecs: [
      { label: 'Screen', value: '7.9-inch wide color gamut LCD, 1920 × 1080, capacitive touch' },
      { label: 'HDR and VRR', value: 'HDR10 support, VRR up to 120 Hz' },
      { label: 'TV output', value: 'Up to 3840 × 2160 (4K) at 60 fps through the included dock' },
      { label: 'Storage', value: '256 GB (UFS), part of it reserved for system use' },
      { label: 'Expansion', value: 'microSD Express cards only, up to 2 TB' },
      { label: 'Wireless', value: 'Wi-Fi 6 and Bluetooth, plus a wired LAN port on the dock' },
      { label: 'Battery', value: '5220 mAh, approximately 2 – 6.5 hours of play' },
      { label: 'Charging', value: 'About 3 hours in sleep mode; USB-C connectors on the bottom and the top' },
      { label: 'Game media', value: 'Reads both Nintendo Switch 2 and Nintendo Switch game cards' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'Nintendo' },
      { label: 'Model', value: 'Nintendo Switch 2' },
      { label: 'Release date', value: 'June 5, 2025, according to the Nintendo Store listing' },
      {
        label: 'In the box',
        value:
          'Console, Joy-Con 2 (L) in Light Blue, Joy-Con 2 (R) in Light Red, Joy-Con 2 Grip, two Joy-Con 2 Straps, the dock, the AC adapter, a USB-C charging cable and an Ultra High Speed HDMI cable',
      },
      {
        label: 'Joy-Con 2 pairs Nintendo sells separately',
        value: 'Light Blue and Light Red, Light Purple and Light Green, Blue and Light Yellow',
      },
      {
        label: 'Memory cards',
        value: 'Nintendo recommends officially licensed microSD Express cards',
      },
    ],
    specs: [
      {
        group: 'Console',
        rows: [
          {
            label: 'Size, with Joy-Con 2 attached',
            value: 'Approximately 4.5 in tall × 10.7 in wide × 0.55 in thick (about 11.43 × 27.18 × 1.40 cm)',
          },
          {
            label: 'Maximum thickness',
            value: '1.2 in from the tip of the control sticks to the protruding parts of the ZL/ZR buttons',
          },
          {
            label: 'Weight',
            value:
              'Approximately 0.88 lb (about 399 g) on its own, or approximately 1.18 lb (about 535 g) with Joy-Con 2 attached',
          },
          { label: 'Screen', value: '7.9-inch wide color gamut LCD with capacitive touch' },
          { label: 'Screen resolution', value: '1920 × 1080' },
          { label: 'HDR', value: 'HDR10 support' },
          { label: 'Variable refresh rate', value: 'VRR up to 120 Hz' },
          {
            label: 'CPU/GPU',
            value:
              '“Custom processor made by NVIDIA.” Nintendo publishes no clock speeds, core counts or memory capacity.',
          },
          { label: 'Internal storage', value: '256 GB (UFS), part of it reserved for system use' },
          { label: 'Operating environment', value: '41–95 °F, 20–80% humidity' },
        ],
      },
      {
        group: 'Display and video output',
        rows: [
          {
            label: 'Handheld and tabletop resolution',
            value: 'Up to 1920 × 1080, following the console’s own screen resolution',
          },
          { label: 'TV mode output', value: 'Up to 3840 × 2160 (4K) at 60 fps' },
          {
            label: 'Higher frame rates',
            value: '120 fps when 1920 × 1080 or 2560 × 1440 is selected',
          },
          {
            label: 'Conditions',
            value:
              '4K, HDR and VRR in TV mode need a supported game and a compatible display, and frame rate is fixed to a maximum of 60 fps at 4K output',
          },
          {
            label: 'VRR in TV mode',
            value: 'Added by a system update released on September 10, 2026',
          },
          { label: 'Video output', value: 'Through the HDMI connector on the dock, in TV mode' },
        ],
      },
      {
        group: 'Joy-Con 2 controllers',
        rows: [
          {
            label: 'Included controllers',
            value: 'Joy-Con 2 (L) in Light Blue and Joy-Con 2 (R) in Light Red',
          },
          { label: 'Attachment', value: 'Magnetic, with a release button on the back to detach' },
          {
            label: 'Size, each controller',
            value: 'Approximately 4.57 in tall × 0.56 in wide × 1.2 in thick (about 11.61 × 1.42 × 3.05 cm)',
          },
          {
            label: 'Weight, each controller',
            value: 'Joy-Con 2 (L) approximately 2.3 oz (about 65 g); Joy-Con 2 (R) approximately 2.4 oz (about 68 g)',
          },
          { label: 'Wireless', value: 'Joy-Con 2 (L): Bluetooth. Joy-Con 2 (R): Bluetooth and NFC.' },
          { label: 'Sensors', value: 'Accelerometer, gyroscope and mouse sensor in each controller' },
          { label: 'Vibration', value: 'HD rumble 2' },
          {
            label: 'Battery',
            value:
              '500 mAh per controller, approximately 20 hours of use and about 3 hours 30 minutes to charge, when attached to the console or to the Joy-Con 2 charging grip',
          },
          {
            label: 'Buttons, left controller',
            value: 'Left Stick (pressable), Up/Down/Left/Right/L/ZL/SL/SR/-, Capture, Release and Sync',
          },
          {
            label: 'Buttons, right controller',
            value: 'Right Stick (pressable), A/B/X/Y/R/ZR/SL/SR/+, HOME, C, Release and Sync',
          },
        ],
      },
      {
        group: 'Dock',
        rows: [
          {
            label: 'Size',
            value:
              'Approximately 4.5 in tall × 7.9 in wide × 2 in thick (about 11.43 × 20.07 × 5.08 cm); the height includes the 0.08 in added by the feet',
          },
          { label: 'Weight', value: 'Approximately 0.84 lb (about 381 g)' },
          {
            label: 'Ports',
            value:
              'Two USB ports (USB 2.0 compatible) on the side, system connector, AC adapter port, HDMI port and LAN port',
          },
        ],
      },
      {
        group: 'Joy-Con 2 Grip and Strap',
        rows: [
          {
            label: 'Grip size',
            value: 'Approximately 4.57 in tall × 5.67 in wide × 1.58 in thick (about 11.61 × 14.40 × 4.01 cm)',
          },
          { label: 'Grip weight', value: 'Approximately 3.35 oz (about 95 g)' },
          {
            label: 'Strap size',
            value:
              'Approximately 4.6 in tall × 0.65 in wide × 0.28 in thick (about 11.68 × 1.65 × 0.71 cm), excluding the cord',
          },
          { label: 'Strap weight', value: 'Approximately 0.25 oz (about 7 g), excluding the cord' },
        ],
      },
      {
        group: 'Battery and power',
        rows: [
          { label: 'Internal battery', value: 'Lithium-ion, 5220 mAh' },
          {
            label: 'Battery life',
            value:
              'Approximately 2 – 6.5 hours; Nintendo describes these as rough estimates that depend on the games played',
          },
          { label: 'Charging time', value: 'Approximately 3 hours while the system is in sleep mode' },
          {
            label: 'USB-C connectors',
            value:
              'Two: the bottom connector charges the console and connects it to the dock, the top one is for accessories or for charging',
          },
        ],
      },
      {
        group: 'Storage and media',
        rows: [
          {
            label: 'Internal storage',
            value:
              '256 GB (UFS), with a portion reserved for system use; Nintendo describes it as eight times the capacity of the original Nintendo Switch',
          },
          {
            label: 'Memory card slot',
            value:
              'Compatible with microSD Express cards only, up to 2 TB; microSD cards that are not Express-compatible can only copy screenshots and videos from a Nintendo Switch',
          },
          {
            label: 'Game card slot',
            value: 'Accepts both Nintendo Switch 2 and Nintendo Switch game cards',
          },
          {
            label: 'Game-key cards',
            value:
              'A game card that holds no game data, only the key to start the game: the first launch downloads the game, and the card must stay inserted to play',
          },
        ],
      },
      {
        group: 'Audio and communication',
        rows: [
          {
            label: 'Audio output',
            value: 'Linear PCM 5.1ch, output through the HDMI connector in TV mode',
          },
          { label: 'Speakers', value: 'Stereo, in an independent enclosure' },
          {
            label: 'Microphone',
            value:
              'Built-in monaural microphone with noise cancellation, echo cancellation and automatic gain control',
          },
          { label: 'Wireless LAN', value: 'Wi-Fi 6' },
          {
            label: 'Wired internet',
            value: 'Through the LAN port on the dock, in TV mode',
          },
          { label: 'Audio jack', value: '3.5 mm four-contact stereo mini-plug (CTIA standard)' },
        ],
      },
      {
        group: 'Built-in features',
        items: [
          'Three play modes: TV, tabletop and handheld',
          'Kickstand with 150 degrees of freedom for tabletop play',
          'Joy-Con 2 can be used as mice, and both at once in compatible games',
          'C button on the right Joy-Con 2 opens GameChat',
          'GameChat needs a Nintendo Switch Online membership, a Nintendo Account and text-message verification; up to 12 people can join with audio, and up to four with a compatible USB camera',
          'Brightness sensor in the console and a mouse sensor in each controller',
          'NFC on the right Joy-Con 2 only',
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'Nintendo publishes no RAM capacity, core count or clock speed: its technical-specifications page says only “Custom processor made by NVIDIA.”',
          'No storage read or write speed is published, only the 256 GB capacity and the UFS standard.',
          'No water or dust resistance rating is published for the console.',
          'Nintendo’s product pages state no warranty term; warranty support is handled region by region through Nintendo Support.',
          'The pages read for this sheet do not state a colour for the console body, so none is given here, although the Joy-Con 2 colours are listed in detail.',
          'Battery life is a range rather than a figure, because Nintendo says it depends on the games played.',
          'Beyond “stereo”, Nintendo publishes no figures for the built-in speakers.',
        ],
      },
    ],
  },

  'aula-f75-pro-wireless-keyboard': {
    slug: 'aula-f75-pro-wireless-keyboard',
    priceBox: {
      label: 'Owner-entered price',
      amount: '$64.99',
      asOf: '2026-10-21',
      source: 'Entered by hand by the site owner, October 21, 2026',
    },
    displayName: 'AULA F75 Pro',
    status: 'available',
    // The official AULA F75 Pro listing. It publishes no dimensions, weight,
    // polling rate or in-box list, so none of those appears here. Battery life
    // is AULA's own estimate and is labelled as a claim, not a measurement.
    specSource:
      "AULA's official F75 Pro product page on aulagaming.com (the 'Knob Side-Printed Mechanical Keyboard' listing), checked in October 2026",
    metaDescription:
      'AULA F75 Pro spec sheet: a 75% 81-key gasket-mounted board with hot-swap sockets, tri-mode 2.4 GHz, Bluetooth 5.0 and USB-C, plus an 8,000 mAh battery.',
    // No folder image is used here: the only clean-looking shot of the board
    // turned out to be an AI render whose side-printed legends do not spell real
    // keys ("P10", "FT1", "DNL", "WIR"), so it is not this exact board. The page
    // therefore keeps the catalog record's own image alone.
    highlights: [
      { label: 'Layout', value: '75%, 81 keys' },
      { label: 'Mount', value: 'Gasket' },
      { label: 'Switches', value: 'Hot-swap 3/5-pin' },
      { label: 'Connection', value: '2.4 GHz, BT 5.0, USB-C' },
      { label: 'Battery', value: '8,000 mAh' },
    ],
    keySpecs: [
      { label: 'Layout', value: '75%, 81 keys' },
      { label: 'Mount', value: 'Gasket structure with IXPE, Poron and silicone padding' },
      { label: 'Keycaps', value: 'PBT, side printed' },
      { label: 'Switches', value: 'Pre-lubed linear Reaper switches on the listing reviewed' },
      { label: 'Hot-swap', value: '3-pin and 5-pin switches' },
      { label: 'Connection', value: '2.4 GHz wireless, Bluetooth 5.0, USB-C wired' },
      { label: 'Battery', value: '8,000 mAh' },
      { label: 'Lighting', value: 'South-facing RGB, 16 static and 10 dynamic modes' },
    ],
    additionalInfo: [
      { label: 'Brand', value: 'AULA' },
      { label: 'Model', value: 'F75 Pro' },
      { label: 'Form factor', value: '75% compact layout' },
      { label: 'Controls', value: 'Metal multifunction knob for media and lighting' },
      { label: 'Key rollover', value: 'Full N-key rollover with anti-ghosting' },
      { label: 'Systems', value: 'Windows, macOS, Android and iOS' },
      { label: 'Software', value: 'AULA provides a download for key remapping and lighting' },
    ],
    specs: [
      {
        group: 'Layout and build',
        rows: [
          { label: 'Layout', value: '75%, 81 keys' },
          { label: 'Mount', value: 'Gasket mount' },
          { label: 'Dampening', value: 'IXPE, Poron and silicone padding' },
          { label: 'Keycaps', value: 'PBT, side printed' },
          { label: 'Knob', value: 'Metal multifunction control knob' },
          { label: 'Kickstand', value: 'Two-stage' },
        ],
      },
      {
        group: 'Switches',
        rows: [
          { label: 'Switch type', value: 'Pre-lubed linear Reaper switches' },
          { label: 'Stabilisers', value: 'Pre-lubed' },
          { label: 'Hot-swap', value: 'Yes, for 3-pin and 5-pin switches' },
        ],
      },
      {
        group: 'Connection',
        rows: [
          { label: 'Wireless', value: '2.4 GHz' },
          { label: 'Bluetooth', value: 'Bluetooth 5.0' },
          { label: 'Wired', value: 'USB-C' },
          { label: 'Rollover', value: 'Full N-key rollover with anti-ghosting' },
          { label: 'Windows key lock', value: 'Yes' },
        ],
      },
      {
        group: 'Battery and lighting',
        rows: [
          { label: 'Battery', value: '8,000 mAh rechargeable' },
          { label: 'Battery life, backlight on', value: 'About 30 hours, according to AULA' },
          { label: 'Battery life, backlight off', value: 'About 80 hours, according to AULA' },
          { label: 'Lighting', value: 'South-facing RGB, 16 static and 10 dynamic modes' },
        ],
      },
      {
        group: 'Compatibility',
        rows: [
          { label: 'Systems', value: 'Windows, macOS, Android and iOS' },
          { label: 'Software', value: 'AULA download for remapping and lighting' },
        ],
      },
      {
        group: 'Notable limitations',
        items: [
          'AULA publishes no dimensions, weight or polling rate for this model.',
          'The battery figures are AULA\u2019s own estimates: about 30 hours with the backlight on, about 80 with it off.',
          'The listing sells several colour and switch variants, so check which switch the exact one you order carries.',
          'The official page reviewed does not list what is in the box.',
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
      // Absent on an informational entry: the page renders no purchase panel,
      // so there is no link for a button to use.
      ...(own.buyUrl ? { buyUrl: own.buyUrl } : {}),
      // The page's own content date, so a standalone Quick Look page still gets
      // a real `lastmod` in the sitemap (productDate reads `addedAt`).
      ...(own.addedAt ? { addedAt: own.addedAt } : {}),
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
  const views = QUICK_LOOK_SLUGS.flatMap((slug) => {
    const view = resolveQuickLook(slug)
    return view ? [view] : []
  })
  // Announced-but-not-yet-released products lead the index: a reader is most
  // likely to be looking one up, and the sort is stable, so every other entry
  // keeps its curated order.
  return views.sort(
    (a, b) => Number(b.entry.status === 'upcoming') - Number(a.entry.status === 'upcoming'),
  )
}
