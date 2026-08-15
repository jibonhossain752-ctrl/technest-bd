/**
 * Meta Pixel client helpers.
 * The base code (fbq init + fbevents.js loader) is installed in the root
 * layout via next/script. These helpers only fire events; if the base
 * script has not loaded yet (e.g. on a slow network), they lazily load the
 * SDK and queue calls the same way the official snippet does.
 */

import { getProductBySlug } from '@/data/products'

export const META_PIXEL_ID = '2109685666607933'

const DEDUP_MS = 2000
const lastFired: Record<string, number> = {}

type FbqArgs = unknown[]

function callFbq(...args: FbqArgs) {
  try {
    const w = window as unknown as {
      fbq?: (...a: FbqArgs) => void
      _fbq?: FbqArgs[]
    }
    let fbq = w.fbq
    if (typeof fbq !== 'function') {
      if (!w._fbq) {
        w._fbq = []
        const s = document.createElement('script')
        s.src = 'https://connect.facebook.net/en_US/fbevents.js'
        s.async = true
        document.head.appendChild(s)
      }
      fbq = (...a: FbqArgs) => w._fbq!.push(a)
    }
    fbq(...args)
  } catch {
    /* pixel must never break the page */
  }
}

/** Dedupe identical pixel calls within a short window (mirrors the internal tracker). */
function dedupKey(name: string, params?: Record<string, unknown>): string {
  try {
    return name + '|' + JSON.stringify(params ?? {})
  } catch {
    return name
  }
}

export function pixelTrack(name: string, params?: Record<string, unknown>) {
  const key = dedupKey(name, params)
  const now = Date.now()
  if (lastFired[key] && now - lastFired[key] < DEDUP_MS) return
  lastFired[key] = now
  callFbq('track', name, params)
}

export function pixelTrackCustom(name: string, params?: Record<string, unknown>) {
  const key = dedupKey(name, params)
  const now = Date.now()
  if (lastFired[key] && now - lastFired[key] < DEDUP_MS) return
  lastFired[key] = now
  callFbq('trackCustom', name, params)
}

/**
 * Standard Meta event params for a product, using the site's own product
 * data as the single source of truth. `value` is only included when a real
 * price exists — never a placeholder.
 */
export function productEventParams(slug: unknown): Record<string, unknown> {
  if (typeof slug !== 'string' || !slug) return {}
  const p = getProductBySlug(slug)
  if (!p) {
    return {
      content_name: slug,
      content_ids: [slug],
      content_type: 'product',
      currency: 'USD',
    }
  }
  const params: Record<string, unknown> = {
    content_name: p.name,
    content_ids: [p.slug],
    content_type: 'product',
    content_category: p.category,
    currency: 'USD',
  }
  if (typeof p.price === 'number') params.value = p.price
  return params
}
