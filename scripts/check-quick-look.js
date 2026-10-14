#!/usr/bin/env node
/**
 * Quick Look guard — fails the build (exit 1) so a broken cross-link, an
 * over-long link list or a trace of the source project's market never ships.
 *
 * Run directly (`node scripts/check-quick-look.js`) or via the `prebuild` npm
 * script. It checks:
 *
 *   1. Cross-links (the one-field rule in src/data/quick-look-links.ts):
 *      every post key is a real blog slug; every product slug is a real
 *      catalog product WITH a Quick Look entry; no slug is listed twice;
 *      at most MAX_PRODUCTS_PER_POST products per post; and no product is
 *      covered by more than MAX_POSTS_PER_QUICK_LOOK posts. Both renderers
 *      (the post's product block and the Quick Look page's blog block) read
 *      that single map, so a typo would break two pages at once.
 *
 *   2. Quick Look data integrity (src/data/quick-look.ts): each entry carries a
 *      display name, a spec source, a hand-written meta description of 120-160
 *      characters with no price or review wording, the detail-page panels
 *      (highlights, key specs, additional info) and at least one spec group with
 *      either label/value rows or bullet items. Each entry also stores no price
 *      without a `priceCheckedOn` date, and no price at all unless it can be
 *      displayed as dated.
 *
 *      An entry is either LINKED to a catalog record or STANDALONE:
 *      - linked: the slug must be a real product slug in src/data/products.ts.
 *      - standalone: it must carry its OWN product block (name, category,
 *        categorySlug, buyUrl, description, features, at least one image) using
 *        a real shop category, an https buy link, no undated price, and a
 *        rating only when it comes with the review count that labels it.
 *      A slug that matches no catalog record and carries no product block is a
 *      failure, so a page can never render around missing data.
 *
 *   3. Market language: the Quick Look source files must not mention the sister
 *      project's country, currency or brand. TARGET is a US store in USD.
 *
 *   4. Removed copy stays removed, and the disclosure stays single. Two strings
 *      were deliberately deleted from the Quick Look surface — the note under
 *      the buy button saying no price is shown, and the line repeating the
 *      listing's warranty term. Neither may come back, the catalog may not
 *      reintroduce a warranty field, the purchase panel must carry its one-line
 *      note about checking the listing, and the Amazon Associates disclosure
 *      must be rendered exactly once across the detail surface (beside the buy
 *      button); the site-wide footer carries the other copy.
 *
 *   5. No breadcrumb on the detail pages, and none marked up. A Quick Look
 *      detail page renders no crumb row and no BreadcrumbList: the visible
 *      ".ql-crumbs" row and its three CSS selectors were deleted on purpose,
 *      because claiming a trail the visitor cannot see misdescribes the page
 *      (memory.md rule 4c). Navigation is the guide's "Keep exploring" links.
 *      The /quick-look listing page is out of scope — it keeps its own
 *      Breadcrumb, which has never rendered anything visible.
 *
 *   6. Slugs, buy links and guide links. Every entry needs a plain
 *      lowercase-hyphenated slug and a buy link that actually goes somewhere
 *      (the page's only call to action). Every guide's "Keep exploring" cards
 *      must point at real pages: a known static route, a real shop category, a
 *      real Quick Look page, or a /product/<slug> that exists in the catalog —
 *      a standalone product has no product page, so linking one would be a 404.
 *      Each guide must also carry a card back to /quick-look and one for its
 *      own category aisle.
 *
 * Loading the TS data: no ts-node in this project, so the same
 * tsc-transpile fallback the other build guards use applies — the shared
 * tsconfig.check-quick-look.json compiles the data layer into
 * .next/tmp-quicklook and this script requires the emitted CommonJS.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const failures = []
const warnings = []

/** Every module the guard reads out of the transpiled data layer. */
const EMITTED = [
  'quick-look-links.js',
  'quick-look.js',
  'products.js',
  'posts.js',
  'categories.js',
  'quick-look-content.js',
]

function loadQuickLookData() {
  const outDir = path.join(ROOT, '.next', 'tmp-quicklook', 'data')
  try {
    // Compile when ANY of the modules is missing, not only the entry file: a
    // newly added data file would otherwise be silently absent and the checks
    // that read it would quietly not run.
    if (EMITTED.some((file) => !fs.existsSync(path.join(outDir, file)))) {
      execSync('npx tsc --project tsconfig.check-quick-look.json', { stdio: 'inherit' })
    }
    return {
      links: require(path.join(outDir, 'quick-look-links.js')),
      quickLook: require(path.join(outDir, 'quick-look.js')),
      products: require(path.join(outDir, 'products.js')),
      posts: require(path.join(outDir, 'posts.js')),
      categories: require(path.join(outDir, 'categories.js')),
      content: require(path.join(outDir, 'quick-look-content.js')),
    }
  } catch (error) {
    console.error(`\ncheck-quick-look: could not load the Quick Look data — ${error.message}`)
    process.exit(1)
  }
}

const { links, quickLook, products, posts, categories, content } = loadQuickLookData()
const { CATEGORIES } = categories
const { QUICK_LOOK_GUIDES } = content

const {
  POST_PRODUCT_LINKS,
  MAX_PRODUCTS_PER_POST,
  MAX_POSTS_PER_QUICK_LOOK,
} = links
const { QUICK_LOOK, QUICK_LOOK_SLUGS } = quickLook
const { PRODUCTS } = products
const { POSTS } = posts

const productSlugs = new Set(PRODUCTS.map((product) => product.slug))
const postSlugs = new Set(POSTS.map((post) => post.slug))

// Shop categories, for validating every entry's aisle link and category name.
const categoryBySlug = new Map(CATEGORIES.map((category) => [category.slug, category]))

/* ── 1. Cross-links ─────────────────────────────────────────────────── */

const postsPerProduct = new Map()

for (const [postSlug, productList] of Object.entries(POST_PRODUCT_LINKS)) {
  if (!postSlugs.has(postSlug)) {
    failures.push(`cross-link key "${postSlug}" is not a blog post slug (src/data/quick-look-links.ts)`)
  }
  if (!Array.isArray(productList)) {
    failures.push(`cross-link entry "${postSlug}" must be an array of product slugs`)
    continue
  }
  if (productList.length > MAX_PRODUCTS_PER_POST) {
    failures.push(
      `post "${postSlug}" links ${productList.length} products (max ${MAX_PRODUCTS_PER_POST})`,
    )
  }
  if (new Set(productList).size !== productList.length) {
    failures.push(`post "${postSlug}" lists the same product slug twice`)
  }
  for (const productSlug of productList) {
    if (!productSlugs.has(productSlug)) {
      failures.push(`post "${postSlug}" references unknown product slug "${productSlug}"`)
      continue
    }
    if (!(productSlug in QUICK_LOOK)) {
      failures.push(
        `post "${postSlug}" links "${productSlug}" which has no Quick Look entry — the reverse lookup would return nothing`,
      )
      continue
    }
    postsPerProduct.set(productSlug, (postsPerProduct.get(productSlug) ?? 0) + 1)
  }
}

for (const [productSlug, count] of postsPerProduct) {
  if (count > MAX_POSTS_PER_QUICK_LOOK) {
    failures.push(
      `product "${productSlug}" is covered by ${count} posts (max ${MAX_POSTS_PER_QUICK_LOOK} render on its Quick Look page; the extras are silently dropped)`,
    )
  }
}

/* ── 2. Quick Look data integrity ───────────────────────────────────── */

for (const slug of Object.keys(QUICK_LOOK)) {
  const entry = QUICK_LOOK[slug]
  if (entry.slug !== slug) {
    failures.push(`Quick Look entry "${slug}" has a mismatched slug field ("${entry.slug}")`)
  }
  // Linked or standalone. A linked entry takes its category, price and rating
  // from its catalog record; a standalone one has to supply all of them itself,
  // because nothing else on the site knows this product exists.
  if (!productSlugs.has(slug)) {
    const own = entry.product
    if (!own) {
      failures.push(
        `Quick Look entry "${slug}" matches no product in src/data/products.ts and carries no own \`product\` block — a standalone entry must supply one (see resolveQuickLook in src/data/quick-look.ts)`,
      )
    } else {
      for (const key of ['name', 'category', 'categorySlug', 'description', 'buyUrl']) {
        if (typeof own[key] !== 'string' || !own[key].trim()) {
          failures.push(`standalone entry "${slug}" has no product.${key}`)
        }
      }
      if (!Array.isArray(own.features) || own.features.length < 3) {
        failures.push(
          `standalone entry "${slug}" needs at least 3 product.features (the detail page's highlight list renders them)`,
        )
      }
      if (typeof own.buyUrl === 'string' && !/^https:\/\//.test(own.buyUrl)) {
        failures.push(`standalone entry "${slug}" has a buyUrl that is not an https link`)
      }
      const category = categoryBySlug.get(own.categorySlug)
      if (!category) {
        failures.push(
          `standalone entry "${slug}" uses categorySlug "${own.categorySlug}", which is not a shop category (the aisle link would 404)`,
        )
      } else if (own.category !== category.name) {
        failures.push(
          `standalone entry "${slug}" category "${own.category}" does not match the shop's name for "${own.categorySlug}" ("${category.name}")`,
        )
      }
      if (!Array.isArray(entry.images) || entry.images.length === 0) {
        failures.push(
          `standalone entry "${slug}" lists no images — the gallery would fall back to an emoji stand-in`,
        )
      }
      // A price the page can never display is data nobody can check, and an
      // undated number is exactly what memory.md rule 3 forbids shipping.
      if (own.price != null && !own.priceCheckedOn) {
        failures.push(
          `standalone entry "${slug}" stores a price with no priceCheckedOn — the page would show a stale number or none at all, so the price must not be stored`,
        )
      }
      if (own.price != null && own.oldPrice != null && own.oldPrice <= own.price) {
        failures.push(
          `standalone entry "${slug}" has an oldPrice (${own.oldPrice}) that is not above its price (${own.price})`,
        )
      }
      if (own.rating != null && (typeof own.rating !== 'number' || own.rating < 0 || own.rating > 5)) {
        failures.push(`standalone entry "${slug}" has a rating outside 0-5`)
      }
      if (own.rating != null && !(own.reviews > 0)) {
        failures.push(
          `standalone entry "${slug}" has a rating with no review count — the row cannot render without one, since the count is what attributes it to Amazon`,
        )
      }
      if (own.reviews != null && !Number.isInteger(own.reviews)) {
        failures.push(`standalone entry "${slug}" has a non-integer review count`)
      }
    }
  }
  if (!entry.displayName || !entry.displayName.trim()) {
    failures.push(`Quick Look entry "${slug}" has no displayName (used for the H1 and meta title)`)
  }
  if (!entry.specSource || !entry.specSource.trim()) {
    failures.push(`Quick Look entry "${slug}" has no specSource — every spec row needs a source`)
  }
  if (!Array.isArray(entry.specs) || entry.specs.length === 0) {
    failures.push(`Quick Look entry "${slug}" has no spec groups`)
  } else {
    for (const group of entry.specs) {
      const rows = Array.isArray(group.rows) ? group.rows : []
      const items = Array.isArray(group.items) ? group.items : []
      if (!group.group || (rows.length === 0 && items.length === 0)) {
        failures.push(
          `Quick Look entry "${slug}" has an empty spec group — every group needs label/value rows or bullet items`,
        )
        continue
      }
      for (const row of rows) {
        if (!row.label || !row.value) {
          failures.push(`Quick Look entry "${slug}" has a spec row missing a label or value`)
        }
        if (/\$|৳|\bBDT\b/i.test(row.value)) {
          failures.push(
            `Quick Look entry "${slug}" spec row "${row.label}" contains a price — prices are not stored as specs`,
          )
        }
      }
      for (const item of items) {
        if (typeof item !== 'string' || !item.trim()) {
          failures.push(`Quick Look entry "${slug}" has an empty bullet in its "${group.group}" group`)
        } else if (/\$|৳|\bBDT\b/i.test(item)) {
          failures.push(
            `Quick Look entry "${slug}" bullet in "${group.group}" contains a price — prices are not stored here`,
          )
        }
      }
    }
  }

  // The detail layout's panels. Missing data is not a crash — the component
  // simply renders nothing — so the guard is what keeps a half-filled page from
  // shipping: the highlight strip, the key specifications panel and the
  // additional info panel are part of every Quick Look page.
  const panelChecks = [
    { key: 'highlights', min: 3 },
    { key: 'keySpecs', min: 5 },
    { key: 'additionalInfo', min: 4 },
  ]
  for (const { key, min } of panelChecks) {
    const rows = entry[key]
    if (!Array.isArray(rows) || rows.length < min) {
      failures.push(
        `Quick Look entry "${slug}" needs at least ${min} ${key} rows (has ${
          Array.isArray(rows) ? rows.length : 0
        }) — the detail layout renders them`,
      )
      continue
    }
    for (const row of rows) {
      if (!row.label || !row.value) {
        failures.push(`Quick Look entry "${slug}" has a ${key} row missing a label or value`)
      } else if (/\$|৳|\bBDT\b/i.test(row.value)) {
        failures.push(`Quick Look entry "${slug}" ${key} row "${row.label}" contains a price`)
      }
    }
  }

  // Variant chips are informational only (this store shows no price), so a
  // missing dimension is fine — but one that ships must carry real labels.
  for (const variant of entry.variants ?? []) {
    if (!variant.label || !Array.isArray(variant.options) || variant.options.length === 0) {
      failures.push(`Quick Look entry "${slug}" has a variant dimension with no label or options`)
      continue
    }
    for (const option of variant.options) {
      if (!option.label) {
        failures.push(`Quick Look entry "${slug}" has a variant option with no label`)
      }
      if (option.note && /\$|৳|\bBDT\b/i.test(option.note)) {
        failures.push(`Quick Look entry "${slug}" variant note "${option.note}" contains a price`)
      }
    }
  }

  // Meta description: hand-written per product, 120-160 characters, and never
  // about a price (the page shows none) or a review (we do not review).
  const metaDescription = entry.metaDescription
  if (typeof metaDescription !== 'string' || !metaDescription.trim()) {
    failures.push(
      `Quick Look entry "${slug}" has no metaDescription — every Quick Look page needs a hand-written one`,
    )
  } else {
    if (metaDescription.length < 120 || metaDescription.length > 160) {
      failures.push(
        `Quick Look entry "${slug}" metaDescription is ${metaDescription.length} characters (must be 120-160)`,
      )
    }
    if (/price|review|tested|৳/i.test(metaDescription)) {
      failures.push(
        `Quick Look entry "${slug}" metaDescription must not mention a price, a review or testing`,
      )
    }
  }
  if (!QUICK_LOOK_SLUGS.includes(slug)) {
    warnings.push(`Quick Look entry "${slug}" is not in QUICK_LOOK_SLUGS (check the catalog join)`)
  }
  if (entry.priceCheckedOn && !/^\d{4}-\d{2}-\d{2}$/.test(entry.priceCheckedOn)) {
    failures.push(`Quick Look entry "${slug}" has a priceCheckedOn that is not an ISO date`)
  }
  const product = PRODUCTS.find((item) => item.slug === slug)
  if (product && product.price != null && !entry.priceCheckedOn) {
    // Not a failure: the UI simply shows no price (see lib/site.ts). Worth a
    // note so nobody "fixes" it by printing a stale number.
    warnings.push(
      `Quick Look entry "${slug}" stores no verified price date — its page shows the Amazon call to action instead of a number`,
    )
  }
}

/* ── 3. Market language ─────────────────────────────────────────────── */

const SOURCE_FILES = [
  'src/data/quick-look.ts',
  'src/data/quick-look-links.ts',
  'src/data/quick-look-content.ts',
  'src/lib/quick-look-schema.ts',
  'src/lib/site.ts',
  'src/components/QuickLookCard.tsx',
  'src/components/QuickLookDetail.tsx',
  'src/components/QuickLookGallery.tsx',
  'src/components/QuickLookGuide.tsx',
  'src/components/LightboxGallery.tsx',
  'src/app/quick-look/page.tsx',
  'src/app/quick-look/[slug]/page.tsx',
]

const BANNED = [
  { pattern: /bangladesh/i, label: 'Bangladesh' },
  { pattern: /৳/, label: '৳ (taka sign)' },
  { pattern: /\bBDT\b/, label: 'BDT' },
  { pattern: /\bjupiter\b/i, label: 'jupiter (source project brand)' },
  { pattern: /\bgrey market\b/i, label: 'grey market' },
  { pattern: /\bPTA\b/, label: 'PTA' },
]

for (const relative of SOURCE_FILES) {
  const full = path.join(ROOT, relative)
  if (!fs.existsSync(full)) {
    failures.push(`expected Quick Look source file is missing: ${relative}`)
    continue
  }
  const text = fs.readFileSync(full, 'utf8')
  for (const { pattern, label } of BANNED) {
    if (pattern.test(text)) {
      failures.push(`${relative} mentions "${label}" — this store is US-only, priced in USD`)
    }
  }
}

/* ── 4. Removed copy, and the disclosure count ──────────────────────── */

// Standing rule (memory.md rule 4): one compact disclosure line beside the buy
// button plus the site-wide footer line. No price notes, no listing-warranty
// text. These exact strings were removed on purpose; a reintroduction fails the
// build so nobody "restores" them by accident.
const REMOVED_COPY = [
  { pattern: /no price is shown here/i, label: 'the removed price note ("no price is shown here…")' },
  { pattern: /warranty stated on the listing/i, label: 'the removed listing-warranty line' },
  { pattern: /ql-warranty/, label: 'the removed .ql-warranty element' },
]

for (const relative of SOURCE_FILES) {
  const full = path.join(ROOT, relative)
  if (!fs.existsSync(full)) continue
  const text = fs.readFileSync(full, 'utf8')
  for (const { pattern, label } of REMOVED_COPY) {
    if (pattern.test(text)) {
      failures.push(`${relative} still carries ${label} — see memory.md rule 4`)
    }
  }
}

// The catalog's own `warranty` field is gone too: a warranty term copied off a
// listing is seller- and region-dependent, so it is not a fact this store can
// publish. Warranty only appears when the manufacturer states it.
const PRODUCTS_FILE = 'src/data/products.ts'
if (fs.existsSync(path.join(ROOT, PRODUCTS_FILE))) {
  const productsText = fs.readFileSync(path.join(ROOT, PRODUCTS_FILE), 'utf8')
  if (/^\s*warranty:/m.test(productsText)) {
    failures.push(
      `${PRODUCTS_FILE} reinstates a warranty field — listing warranty terms are not a publishable fact (memory.md rule 4)`,
    )
  }
}

const DETAIL_SURFACE = ['src/components/QuickLookDetail.tsx', 'src/components/QuickLookGuide.tsx']
let disclosureCount = 0
for (const relative of DETAIL_SURFACE) {
  const full = path.join(ROOT, relative)
  if (!fs.existsSync(full)) {
    failures.push(`expected Quick Look component is missing: ${relative}`)
    continue
  }
  disclosureCount += (fs.readFileSync(full, 'utf8').match(/className="ql-disclosure"/g) || []).length
}
if (disclosureCount !== 1) {
  failures.push(
    `the Quick Look detail surface renders the disclosure ${disclosureCount} time(s) — keep exactly one, beside the buy button (the footer carries the site-wide copy)`,
  )
}

// The purchase panel is one outbound Amazon button, one plain line saying where
// the price lives, and the disclosure. That line is the whole "why is there no
// number here" explanation, so it must survive refactors.
const PURCHASE_NOTE =
  'Amazon prices change often, so check the current price on the listing.'
const detailPath = path.join(ROOT, 'src/components/QuickLookDetail.tsx')
if (fs.existsSync(detailPath)) {
  const detailText = fs.readFileSync(detailPath, 'utf8')
  if (!detailText.includes(PURCHASE_NOTE)) {
    failures.push(
      'src/components/QuickLookDetail.tsx no longer carries the purchase-panel note about checking the listing',
    )
  }
  // No currency figure may render on this surface: the page shows no price.
  if (/\$\d/.test(detailText)) {
    failures.push(
      'src/components/QuickLookDetail.tsx renders a price figure — the Quick Look page shows no price, only the Amazon call to action',
    )
  }
}

/* ── 5. No breadcrumb on the Quick Look detail pages ─────────────────── */

// Standing rule (memory.md rule 4c). Both halves of the detail page's trail
// were removed on purpose: the ported ".ql-crumbs" row in
// src/components/QuickLookDetail.tsx (the only user of those selectors), and
// the shared Breadcrumb render on the detail page.
//
// Source-level on purpose: this guard runs from `prebuild`, before the app is
// compiled, so reading .next here would inspect the PREVIOUS build's HTML and
// fail the first build after a correct fix. The built HTML is verified by hand
// instead (npm run build, then grep the detail pages).
//
// The /quick-look listing page is deliberately excluded: it keeps its own
// Breadcrumb, which renders JSON-LD only and has never put a row on screen.
const DETAIL_PAGE = 'src/app/quick-look/[slug]/page.tsx'
const LISTING_PAGE = 'src/app/quick-look/page.tsx'
const detailPageFull = path.join(ROOT, DETAIL_PAGE)

if (!fs.existsSync(detailPageFull)) {
  failures.push(`expected Quick Look detail page is missing: ${DETAIL_PAGE}`)
} else {
  const detailPageText = fs.readFileSync(detailPageFull, 'utf8')
  if (/BreadcrumbList/.test(detailPageText)) {
    failures.push(
      `${DETAIL_PAGE} emits BreadcrumbList — the detail page has no visible breadcrumb, so it must not claim one (memory.md rule 4c)`,
    )
  }
  if (/Breadcrumb/.test(detailPageText)) {
    failures.push(
      `${DETAIL_PAGE} renders the shared Breadcrumb component — Quick Look detail pages carry no breadcrumb, visible or marked up (memory.md rule 4c)`,
    )
  }
}

// The removed row and its CSS may not come back either. globals.css is scanned
// because that is where the row's selectors lived: no other page ever used
// them, so deleting them was safe and re-adding them is a regression.
const NO_CRUMB_SURFACE = [
  ...SOURCE_FILES.filter((relative) => relative !== LISTING_PAGE),
  'src/app/globals.css',
]

for (const relative of new Set(NO_CRUMB_SURFACE)) {
  const full = path.join(ROOT, relative)
  if (!fs.existsSync(full)) continue
  const text = fs.readFileSync(full, 'utf8')
  if (/ql-crumbs/.test(text)) {
    failures.push(
      `${relative} still carries the removed ".ql-crumbs" breadcrumb row — Quick Look detail pages have no crumb row (memory.md rule 4c)`,
    )
  }
  if (/BreadcrumbList/.test(text)) {
    failures.push(
      `${relative} emits BreadcrumbList — only the /quick-look listing page may carry one (memory.md rule 4c)`,
    )
  }
}

/* ── 6. Slugs, buy links and guide links ─────────────────────────────── */

// Three things every page needs on its own, whichever data shape it uses: a
// slug that is a real route segment, a buy link that goes somewhere, and
// "Keep exploring" cards aimed at pages that exist. A /product/<slug> card is
// only allowed when that product is in the catalog: a standalone product has
// no /product page, so linking one would ship a 404.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const STATIC_HREFS = new Set([
  '/quick-look',
  '/shop',
  '/deals',
  '/blog',
  '/faq',
  '/about',
  '/contact',
])

/** The buy link behind the page's only call to action. */
const buyLinkFor = (slug) =>
  PRODUCTS.find((product) => product.slug === slug)?.buyUrl ?? QUICK_LOOK[slug]?.product?.buyUrl

/** The shop category the page belongs to, from either data shape. */
const categoryFor = (slug) =>
  PRODUCTS.find((product) => product.slug === slug)?.categorySlug ??
  QUICK_LOOK[slug]?.product?.categorySlug

for (const slug of Object.keys(QUICK_LOOK)) {
  if (!SLUG_PATTERN.test(slug)) {
    failures.push(`Quick Look slug "${slug}" is not a plain lowercase-hyphenated route segment`)
  }
  const buyUrl = buyLinkFor(slug)
  if (!buyUrl) {
    failures.push(
      `Quick Look entry "${slug}" has no buy link — the page's only call to action would be missing (a linked entry needs its record's buyUrl, a standalone entry its own)`,
    )
  } else if (!/^https:\/\//.test(buyUrl)) {
    failures.push(`Quick Look entry "${slug}" has a buy link that is not an https URL`)
  }
}

for (const [slug, guide] of Object.entries(QUICK_LOOK_GUIDES)) {
  if (!(slug in QUICK_LOOK)) {
    failures.push(`guide "${slug}" has no Quick Look entry — nothing renders it`)
    continue
  }
  const links = Array.isArray(guide.links) ? guide.links : []
  if (links.length === 0) {
    failures.push(`guide "${slug}" has no "Keep exploring" cards — the page would have no way out`)
  }
  for (const link of links) {
    if (!link.label || !link.description || !link.href) {
      failures.push(
        `guide "${slug}" has a "Keep exploring" card missing its label, description or href`,
      )
      continue
    }
    if (STATIC_HREFS.has(link.href)) continue
    if (link.href.startsWith('/shop/')) {
      if (!categoryBySlug.has(link.href.slice('/shop/'.length))) {
        failures.push(`guide "${slug}" links to ${link.href}, which is not a shop category`)
      }
      continue
    }
    if (link.href.startsWith('/product/')) {
      if (!productSlugs.has(link.href.slice('/product/'.length))) {
        failures.push(
          `guide "${slug}" links to ${link.href}, a product page that does not exist — a Quick Look page may only link to a product it shares with the shop`,
        )
      }
      continue
    }
    if (link.href.startsWith('/quick-look/')) {
      if (!QUICK_LOOK_SLUGS.includes(link.href.slice('/quick-look/'.length))) {
        failures.push(`guide "${slug}" links to ${link.href}, which has no Quick Look page`)
      }
      continue
    }
    failures.push(`guide "${slug}" links to ${link.href}, which is not a known route`)
  }
  if (!links.some((link) => link.href === '/quick-look')) {
    failures.push(`guide "${slug}" has no card back to /quick-look`)
  }
  const categorySlug = categoryFor(slug)
  if (categorySlug && !links.some((link) => link.href === `/shop/${categorySlug}`)) {
    failures.push(`guide "${slug}" has no card for its own aisle (/shop/${categorySlug})`)
  }
}

// A page without a guide still renders its spec sheet (see memory.md), but
// every page shipped in a batch is expected to carry one, so say so out loud.
for (const slug of Object.keys(QUICK_LOOK)) {
  if (!(slug in QUICK_LOOK_GUIDES)) {
    warnings.push(`Quick Look entry "${slug}" has no guide — the page renders its spec sheet alone`)
  }
}

/* ── Report ─────────────────────────────────────────────────────────── */

for (const warning of warnings) {
  console.warn(`check-quick-look: warning — ${warning}`)
}

if (failures.length > 0) {
  console.error(
    [
      '',
      '┌─────────────────────────────────────────────────────────────┐',
      '│  QUICK LOOK GUARD FAILED (scripts/check-quick-look.js)       │',
      '└─────────────────────────────────────────────────────────────┘',
      '',
      ...failures.map((failure) => `  • ${failure}`),
      '',
      'Cross-links live in src/data/quick-look-links.ts, the data layer in',
      'src/data/quick-look.ts. Fix the data, not this script.',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

const crossLinked = Object.keys(POST_PRODUCT_LINKS).length
console.log(
  `check-quick-look: OK — ${QUICK_LOOK_SLUGS.length} Quick Look page(s), ${crossLinked} cross-linked post(s), ${warnings.length} warning(s)`,
)
