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

  // ── Standalone entries ────────────────────────────────────────────────────
  // None of these products is in src/data/products.ts: they get no shop card
  // and no /product page, only the spec sheet below. Every fact in a `product`
  // block comes from the manufacturer's own pages (see `specSource` on each
  // entry). No price and no rating is stored on any of them, so their pages
  // render the Amazon button alone — nothing is ever estimated or hardcoded.
  'apple-airpods-pro-3': {
    slug: 'apple-airpods-pro-3',
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
