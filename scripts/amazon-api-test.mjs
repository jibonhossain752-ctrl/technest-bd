#!/usr/bin/env node
/**
 * One-off Amazon Creators API smoke test — NOT part of the build.
 *
 * It loads .env.local, then calls the real server client
 * (src/lib/amazon-creators.ts) ONE time for five ASINs, prints a table and
 * compares each returned title with the product name the site ships for that
 * slug. Nothing is written anywhere.
 *
 *   node scripts/amazon-api-test.mjs
 *
 * Secrets: the four AMAZON_* variables are read from the environment (or
 * .env.local) and never printed. Only HTTP status codes and Amazon's own error
 * text can reach the output.
 *
 * Requirements: Node with native TypeScript type-stripping (22.18+). On older
 * Node the script compiles the two data/client files with the project's tsc
 * into .next/tmp-amazon-test first.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const require = createRequire(import.meta.url)

const REQUIRED_ENV = [
  'AMAZON_CREATORS_CREDENTIAL_ID',
  'AMAZON_CREATORS_CREDENTIAL_SECRET',
  'AMAZON_CREATORS_CREDENTIAL_VERSION',
  'AMAZON_ASSOCIATE_TAG',
]

/** Load KEY=VALUE lines from .env.local without echoing any value. */
function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    if (process.env[key] !== undefined) continue
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

/** Import a .ts module natively, or via a one-off tsc emit on older Node. */
async function importTs(relPath) {
  const abs = path.join(ROOT, relPath)
  try {
    return await import(pathToFileURL(abs).href)
  } catch (error) {
    const code = error && error.code
    if (code !== 'ERR_UNKNOWN_FILE_EXTENSION' && code !== 'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING') {
      throw error
    }
    const outDir = path.join(ROOT, '.next', 'tmp-amazon-test')
    execFileSync(
      'npx',
      [
        'tsc',
        relPath,
        '--outDir',
        outDir,
        '--module',
        'commonjs',
        '--target',
        'ES2022',
        '--moduleResolution',
        'node',
        '--skipLibCheck',
      ],
      { stdio: 'inherit' },
    )
    const emitted = path.join(outDir, path.basename(relPath).replace(/\.ts$/, '.js'))
    return require(emitted)
  }
}

/** Product names live in the data layer, not in this script. */
function loadProductNames() {
  const outDir = path.join(ROOT, '.next', 'tmp-quicklook', 'data')
  if (!fs.existsSync(path.join(outDir, 'products.js'))) {
    execFileSync('npx', ['tsc', '--project', 'tsconfig.check-quick-look.json'], { stdio: 'inherit' })
  }
  const { PRODUCTS } = require(path.join(outDir, 'products.js'))
  return new Map(PRODUCTS.map((product) => [product.slug, product.name]))
}

const STOPWORDS = new Set(['the', 'and', 'with', 'for', 'of', 'a', 'in', 'to', 'edition'])

function tokens(text) {
  return [
    ...new Set(
      String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter((token) => token && !STOPWORDS.has(token)),
    ),
  ]
}

/**
 * Compare an Amazon title with our product name. A listing is a MATCH when it
 * carries at least 60% of our name's meaningful tokens; the missing tokens are
 * always printed so a human can judge the borderline ones.
 */
function compare(expected, actual) {
  if (!actual) return { verdict: 'MISMATCH', coverage: 0, missing: tokens(expected) }
  const have = new Set(tokens(actual))
  const wanted = tokens(expected)
  const missing = wanted.filter((token) => !have.has(token))
  const coverage = wanted.length ? (wanted.length - missing.length) / wanted.length : 0
  return { verdict: coverage >= 0.6 ? 'match' : 'MISMATCH', coverage, missing }
}

function cell(value, width) {
  const text = value === null || value === undefined ? '—' : String(value)
  return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width)
}

loadEnvLocal()

const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name])
if (missingEnv.length) {
  console.error('Cannot run: missing environment variable names:')
  for (const name of missingEnv) console.error(`  - ${name}`)
  console.error('Add them to .env.local (never commit them) and re-run.')
  process.exit(2)
}

const { getItems } = await importTs('src/lib/amazon-creators.ts')
const { AMAZON_ASINS } = await importTs('src/data/amazon-asins.ts')
const productNames = loadProductNames()

/** The four owner ASINs under test, plus Sony if its link revealed one. */
const OWNER_SLUGS = [
  'aula-f75-pro-wireless-keyboard',
  'ugreen-usb-c-hub-5-in-1',
  'playstation-5-disc-console-slim',
  'samsung-galaxy-z-fold7-256gb',
]

const targets = OWNER_SLUGS.map((slug) => ({ slug, asin: AMAZON_ASINS[slug]?.asin }))
const sony = AMAZON_ASINS['sony-wh-1000xm5-headphones']
targets.push({ slug: 'sony-wh-1000xm5-headphones', asin: sony?.asin ?? null })

const usable = targets.filter((target) => target.asin)
if (usable.length !== targets.length) {
  for (const target of targets) {
    if (!target.asin) console.error(`No ASIN in the registry for ${target.slug} — skipped.`)
  }
}

console.log(`Credential version in use: ${process.env.AMAZON_CREATORS_CREDENTIAL_VERSION}`)
console.log(`Requesting ${usable.length} ASIN(s) in one GetItems call…\n`)

let items
try {
  items = await getItems(usable.map((target) => target.asin))
} catch (error) {
  // The client is written not to throw; this only guards the test itself.
  console.error(`Call failed: ${error && error.message ? error.message : 'unknown error'}`)
  process.exit(1)
}

const byAsin = new Map(items.map((item) => [item.asin, item]))

const header = [
  cell('ASIN', 12),
  cell('Returned title', 58),
  cell('Price', 9),
  cell('Cur', 4),
  cell('Availability', 20),
  cell('List price', 10),
  cell('Rating', 7),
  cell('Reviews', 8),
  cell('Fetched at', 20),
  cell('Verdict', 9),
  'Missing tokens',
].join(' | ')

console.log(header)
console.log('-'.repeat(header.length))

let failures = 0
for (const { slug, asin } of usable) {
  const item = byAsin.get(asin)
  const expectedName = productNames.get(slug) ?? slug
  if (!item) {
    console.log(`${cell(asin, 12)} | no result returned`)
    failures++
    continue
  }
  if (item.error) failures++
  const { verdict, coverage, missing } = compare(expectedName, item.title)
  if (verdict === 'MISMATCH') failures++
  console.log(
    [
      cell(asin, 12),
      cell(item.title ?? `ERROR ${item.error}`, 58),
      cell(item.price === null ? '—' : item.price.toFixed(2), 9),
      cell(item.currency, 4),
      cell(item.availability, 20),
      cell(item.listPrice === null || item.listPrice === undefined ? '—' : item.listPrice.toFixed(2), 10),
      cell(item.rating ?? '—', 7),
      cell(item.reviews ?? '—', 8),
      cell(item.fetchedAt, 20),
      cell(`${verdict} ${Math.round(coverage * 100)}%`, 9),
      missing.join(' ') || '—',
    ].join(' | '),
  )
  console.log(`  our name: ${expectedName}`)
}

console.log('')
if (failures > 0) {
  console.log(`${failures} row(s) failed or mismatched.`)
  process.exit(1)
}
console.log('All rows returned a title that matches the product name.')
