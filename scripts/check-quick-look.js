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
 *   2. Quick Look data integrity (src/data/quick-look.ts): each entry joins a
 *      real product slug, carries a display name, a spec source and at least
 *      one spec row, and stores no price without a `priceCheckedOn` date.
 *
 *   3. Market language: the Quick Look source files must not mention the sister
 *      project's country, currency or brand. TARGET is a US store in USD.
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

function loadQuickLookData() {
  const outDir = path.join(ROOT, '.next', 'tmp-quicklook', 'data')
  const entry = path.join(outDir, 'quick-look-links.js')
  try {
    if (!fs.existsSync(entry)) {
      execSync('npx tsc --project tsconfig.check-quick-look.json', { stdio: 'inherit' })
    }
    return {
      links: require(entry),
      quickLook: require(path.join(outDir, 'quick-look.js')),
      products: require(path.join(outDir, 'products.js')),
      posts: require(path.join(outDir, 'posts.js')),
    }
  } catch (error) {
    console.error(`\ncheck-quick-look: could not load the Quick Look data — ${error.message}`)
    process.exit(1)
  }
}

const { links, quickLook, products, posts } = loadQuickLookData()

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
  if (!productSlugs.has(slug)) {
    failures.push(`Quick Look entry "${slug}" matches no product in src/data/products.ts`)
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
      if (!group.group || !Array.isArray(group.rows) || group.rows.length === 0) {
        failures.push(`Quick Look entry "${slug}" has an empty spec group`)
        continue
      }
      for (const row of group.rows) {
        if (!row.label || !row.value) {
          failures.push(`Quick Look entry "${slug}" has a spec row missing a label or value`)
        }
        if (/\$|৳|\bBDT\b/i.test(row.value)) {
          failures.push(
            `Quick Look entry "${slug}" spec row "${row.label}" contains a price — prices are not stored as specs`,
          )
        }
      }
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
