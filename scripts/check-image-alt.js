#!/usr/bin/env node
/**
 * Image alt-text guard — warnings only, it never fails the build.
 *
 * Run directly (node scripts/check-image-alt.js) or automatically after a build
 * via the `postbuild` npm script. Two passes:
 *
 *   1. Source scan  — every <img> / <Image> in the src components (admin
 *                     excluded) must carry an alt attribute.
 *   2. Built pages  — every prerendered page in .next/server/app is checked for
 *                     images without alt, and for the same alt describing two
 *                     *different* images on one page (same alt on the same
 *                     picture is fine).
 *
 * Alt text itself comes from src/lib/imageAlt.ts; this only reports drift.
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const BUILT = path.join(ROOT, '.next', 'server', 'app')
const SKIP_SEGMENTS = new Set(['node_modules', '.next', 'admin'])
const MAX_LIST = 20

function walk(dir, extensions, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_SEGMENTS.has(entry.name)) continue
      walk(full, extensions, out)
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(full)
    }
  }
  return out
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

/** 1. Source pass: tags without an alt attribute. */
function scanSource() {
  const files = walk(SRC, ['.tsx'])
  const missing = []
  let tags = 0

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const tagPattern = /<(?:img|Image)\b[^>]*>/g
    for (const match of text.matchAll(tagPattern)) {
      tags += 1
      if (!/\balt\s*=/.test(match[0])) {
        missing.push({
          file: path.relative(ROOT, file),
          line: lineOf(text, match.index),
          tag: match[0].replace(/\s+/g, ' ').slice(0, 90),
        })
      }
    }
  }
  return { files: files.length, tags, missing }
}

/** next/image renders `/_next/image?url=<encoded>&w=..&q=..`; unwrap to the file. */
function imageFile(src) {
  const optimized = src.match(/\/_next\/image\?url=([^&]+)/)
  if (optimized) {
    try {
      return decodeURIComponent(optimized[1])
    } catch {
      return src
    }
  }
  return src.split('?')[0]
}

/** 2. Built-page pass: images with no alt, and one alt covering different images. */
function scanBuiltPages() {
  if (!fs.existsSync(BUILT)) {
    return { pages: 0, images: 0, missing: [], duplicates: [] }
  }
  const files = walk(BUILT, ['.html'])
  const missing = []
  const duplicates = []
  let images = 0

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8')
    const byAlt = new Map()
    let pageImages = 0

    for (const match of html.matchAll(/<img\b[^>]*>/g)) {
      pageImages += 1
      const tag = match[0]
      const alt = tag.match(/\balt="([^"]*)"/)
      if (!alt) {
        missing.push({ page: path.relative(BUILT, file), tag: tag.replace(/\s+/g, ' ').slice(0, 90) })
        continue
      }
      const value = alt[1].trim()
      if (!value) continue
      const src = (tag.match(/\bsrc="([^"]*)"/) ?? [])[1] ?? ''
      const key = value.toLowerCase()
      if (!byAlt.has(key)) byAlt.set(key, { value, files: new Set() })
      byAlt.get(key).files.add(imageFile(src))
    }
    images += pageImages

    for (const { value, files: sources } of byAlt.values()) {
      if (sources.size > 1) {
        duplicates.push({
          page: path.relative(BUILT, file),
          alt: value,
          images: [...sources].slice(0, 3),
        })
      }
    }
  }
  return { pages: files.length, images, missing, duplicates }
}

function report() {
  const source = scanSource()
  console.log(
    `[alt] source: ${source.tags} image tags across ${source.files} components, ${source.missing.length} without an alt attribute`,
  )
  source.missing.slice(0, MAX_LIST).forEach((m) => console.log(`[alt]   ${m.file}:${m.line}  ${m.tag}`))

  const built = scanBuiltPages()
  if (built.pages === 0) {
    console.log('[alt] built pages: none found — run after `next build` for the page-level check')
  } else {
    console.log(
      `[alt] pages: ${built.images} images across ${built.pages} prerendered pages, ${built.missing.length} without alt, ${built.duplicates.length} alt reused for different images`,
    )
  }
  built.missing.slice(0, MAX_LIST).forEach((m) => console.log(`[alt]   ${m.page}  ${m.tag}`))
  built.duplicates.slice(0, MAX_LIST).forEach((d) =>
    console.log(`[alt]   ${d.page}\n[alt]     "${d.alt}" is on: ${d.images.join(' , ')}`),
  )

  if (source.missing.length === 0 && built.missing.length === 0 && built.duplicates.length === 0) {
    console.log('[alt] OK — every image has alt text and no alt describes two different images.')
  }
}

try {
  report()
} catch (error) {
  console.log(`[alt] check skipped: ${error && error.message}`)
}
