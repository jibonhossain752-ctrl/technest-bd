/**
 * Amazon Creators API client — SERVER ONLY.
 *
 * Credentials are read from the environment on every call (never from files,
 * never with a NEXT_PUBLIC_ prefix, never logged):
 *   AMAZON_CREATORS_CREDENTIAL_ID
 *   AMAZON_CREATORS_CREDENTIAL_SECRET
 *   AMAZON_CREATORS_CREDENTIAL_VERSION  (3.1 NA / 3.2 EU / 3.3 FE)
 *   AMAZON_ASSOCIATE_TAG
 *
 * Documented flow (affiliate-program.amazon.com/creatorsapi):
 *   1. POST the credential version's Login with Amazon token endpoint with
 *      grant_type=client_credentials and scope=creatorsapi::default.
 *      The token lives 1 hour (expires_in: 3600) and MUST be cached and
 *      reused; fetching one per request trips the token endpoint's rate limit.
 *   2. POST https://creatorsapi.amazon/catalog/v1/getItems with
 *      Authorization: Bearer <token>, Content-Type: application/json and
 *      x-marketplace: www.amazon.com. Up to 10 ASINs per call.
 *
 * Only documented GetItems resources are requested (itemInfo.title,
 * offersV2.listings.price, offersV2.listings.availability,
 * offersV2.listings.isBuyBoxWinner). The Creators API
 * does not expose CustomerReviews at all — its high-level resources are
 * BrowseNodeInfo, Images, ItemInfo, OffersV2 and ParentASIN — so `rating` and
 * `reviews` are always undefined here. Asking for an undocumented resource
 * would fail the whole request with ValidationException.
 *
 * Caching: the License allows Product Advertising Content to be cached for up
 * to 24 hours (images: link only). Offer data is the volatile part, so this
 * module caches a whole record for 1 hour, inside both limits. ASINs may be
 * stored indefinitely (see src/data/amazon-asins.ts).
 *
 * This module never throws to a caller: it returns one typed result per ASIN,
 * with `error` set when that ASIN could not be fetched. No page imports it in
 * phase 1.
 */

export const MARKETPLACE = 'www.amazon.com'

/** Creators API version → Login with Amazon token endpoint. */
const TOKEN_ENDPOINTS: Record<string, string> = {
  '3.1': 'https://api.amazon.com/auth/o2/token',
  '3.2': 'https://api.amazon.co.uk/auth/o2/token',
  '3.3': 'https://api.amazon.co.jp/auth/o2/token',
}

const API_ENDPOINT = 'https://creatorsapi.amazon/catalog/v1/getItems'

/** Documented maximum itemIds per GetItems call. */
const MAX_ASINS_PER_CALL = 10

/** Per-record cache TTL: 1 hour, matching the documented Offers cache window. */
const RECORD_TTL_MS = 60 * 60 * 1000

/** Refresh the token this long before it expires. */
const TOKEN_SKEW_MS = 5 * 60 * 1000

const REQUEST_TIMEOUT_MS = 10_000
/** One retry only: a page render can afford 2 attempts, never a queue. */
const MAX_RETRIES = 1

/** Only the resources documented for GetItems, and only what this site needs. */
const RESOURCES = [
  'itemInfo.title',
  'offersV2.listings.price',
  'offersV2.listings.availability',
  'offersV2.listings.isBuyBoxWinner',
]

const ASIN_PATTERN = /^[A-Z0-9]{10}$/

export interface AmazonItem {
  asin: string
  title: string | null
  price: number | null
  currency: string | null
  availability: string | null
  /** Struck-through / list price from savingBasis, when Amazon returns one. */
  listPrice?: number | null
  /** Always undefined: the Creators API has no CustomerReviews resource. */
  rating?: number
  /** Always undefined: the Creators API has no CustomerReviews resource. */
  reviews?: number
  /** ISO timestamp of the API response this record came from. */
  fetchedAt: string
  /** Present only when this ASIN could not be fetched. Carries no secrets. */
  error?: string
}

interface CreatorsConfig {
  id: string
  secret: string
  version: string
  tag: string
}

interface CachedRecord {
  item: AmazonItem
  expiresAt: number
}

/** In-process caches. One server process reuses both across requests. */
const recordCache = new Map<string, CachedRecord>()
let tokenCache: { accessToken: string; expiresAt: number; credentialId: string } | null = null
let tokenInFlight: Promise<TokenResult> | null = null

interface TokenResult {
  token: string | null
  /** Present when the token could not be obtained. No secrets. */
  error?: string
}

// Belt-and-braces server-only guard: importing this into a client bundle is a
// bug, and failing loudly at build/render time is better than shipping it.
if (typeof window !== 'undefined') {
  throw new Error('amazon-creators is server-only and cannot run in the browser')
}

function readConfig(): CreatorsConfig | null {
  const id = process.env.AMAZON_CREATORS_CREDENTIAL_ID
  const secret = process.env.AMAZON_CREATORS_CREDENTIAL_SECRET
  const version = process.env.AMAZON_CREATORS_CREDENTIAL_VERSION
  const tag = process.env.AMAZON_ASSOCIATE_TAG
  if (!id || !secret || !version || !tag) return null
  return { id, secret, version, tag }
}

/** True when all four environment variables are present. */
export function creatorsApiConfigured(): boolean {
  return readConfig() !== null
}

/** API-facing token endpoint for a credential version, e.g. "3.1" → NA. */
export function tokenEndpointFor(version: string): string | null {
  const key = Object.keys(TOKEN_ENDPOINTS).find((v) => version.startsWith(v))
  return key ? TOKEN_ENDPOINTS[key] : null
}

/** Trim an API error body to type/message/reason only — never the request. */
function apiErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    const type = typeof b.type === 'string' ? b.type : undefined
    const message = typeof b.message === 'string' ? b.message : undefined
    const reason = typeof b.reason === 'string' ? b.reason : undefined
    const errorCode = typeof b.error === 'string' ? b.error : undefined
    const description = typeof b.error_description === 'string' ? b.error_description : undefined
    const detail = [type, reason, message ?? description ?? errorCode].filter(Boolean).join(' — ')
    if (detail) return `HTTP ${status}: ${detail}`
  }
  return `HTTP ${status}`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Fetch (and cache) an access token. */
async function getAccessToken(): Promise<TokenResult> {
  const config = readConfig()
  if (!config) return { token: null, error: 'Amazon Creators API credentials are not configured.' }

  const endpoint = tokenEndpointFor(config.version)
  if (!endpoint) {
    return { token: null, error: 'Unknown AMAZON_CREATORS_CREDENTIAL_VERSION.' }
  }

  if (tokenCache && tokenCache.credentialId === config.id && tokenCache.expiresAt > Date.now()) {
    return { token: tokenCache.accessToken }
  }

  if (tokenInFlight) return tokenInFlight

  tokenInFlight = (async () => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: config.id,
            client_secret: config.secret,
            scope: 'creatorsapi::default',
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        const body = await readJson(response)

        if (!response.ok) {
          // 429 from the token endpoint means a missing cache; back off once.
          if (response.status === 429 && attempt < MAX_RETRIES) {
            const retryAfter = Number(response.headers.get('retry-after'))
            await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 2000)
            continue
          }
          return { token: null, error: apiErrorMessage(response.status, body) }
        }

        const accessToken =
          body && typeof body === 'object' ? (body as Record<string, unknown>).access_token : undefined
        const expiresIn =
          body && typeof body === 'object' ? Number((body as Record<string, unknown>).expires_in) : NaN
        if (typeof accessToken !== 'string' || !accessToken) {
          return { token: null, error: 'Token endpoint returned no access_token.' }
        }

        const lifetime = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 3_600_000
        tokenCache = {
          accessToken,
          expiresAt: Date.now() + Math.max(lifetime - TOKEN_SKEW_MS, 60_000),
          credentialId: config.id,
        }
        return { token: accessToken }
      } catch {
        if (attempt === MAX_RETRIES) return { token: null, error: 'Network error calling the token endpoint.' }
        await sleep(1000 * 2 ** attempt)
      }
    }
    return { token: null, error: 'Token endpoint request failed after retries.' }
  })().finally(() => {
    tokenInFlight = null
  })

  return tokenInFlight
}

function toItem(raw: Record<string, unknown>, fetchedAt: string): AmazonItem {
  const itemInfo = (raw.itemInfo ?? {}) as Record<string, unknown>
  const titleNode = (itemInfo.title ?? {}) as Record<string, unknown>
  const offersV2 = (raw.offersV2 ?? {}) as Record<string, unknown>
  const listings = Array.isArray(offersV2.listings) ? (offersV2.listings as Record<string, unknown>[]) : []
  // Prefer the Buy Box winning listing when Amazon returns several.
  const listing =
    listings.find((entry) => entry?.isBuyBoxWinner === true) ?? (listings[0] as Record<string, unknown> | undefined)
  const price = (listing?.price ?? {}) as Record<string, unknown>
  const money = (price.money ?? {}) as Record<string, unknown>
  const savingBasis = (price.savingBasis ?? {}) as Record<string, unknown>
  const savingMoney = (savingBasis.money ?? {}) as Record<string, unknown>
  const availability = (listing?.availability ?? {}) as Record<string, unknown>

  const amount = typeof money.amount === 'number' ? money.amount : null
  const savingAmount = typeof savingMoney.amount === 'number' ? savingMoney.amount : null
  const title = typeof titleNode.displayValue === 'string' ? titleNode.displayValue : null
  const type = typeof availability.type === 'string' ? availability.type : null
  const message = typeof availability.message === 'string' ? availability.message : null

  return {
    asin: typeof raw.asin === 'string' ? raw.asin : '',
    title,
    price: amount,
    currency: typeof money.currency === 'string' ? money.currency : null,
    availability: type ?? message,
    // Only report a saving basis that is genuinely higher than the price.
    listPrice: savingAmount !== null && amount !== null && savingAmount > amount ? savingAmount : null,
    fetchedAt,
  }
}

interface BatchOutcome {
  items: AmazonItem[]
  /** ASINs Amazon explicitly reported as inaccessible, with its message. */
  errors: Map<string, string>
  /** Request-level error, when the whole call failed. */
  fatal?: string
}

async function callGetItems(asinBatch: string[], config: CreatorsConfig): Promise<BatchOutcome> {
  const fetchedAt = new Date().toISOString()

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { token, error: tokenError } = await getAccessToken()
    if (!token) {
      return { items: [], errors: new Map(), fatal: tokenError ?? 'No Creators API access token.' }
    }

    let response: Response
    try {
      response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-marketplace': MARKETPLACE,
        },
        body: JSON.stringify({
          itemIds: asinBatch,
          itemIdType: 'ASIN',
          marketplace: MARKETPLACE,
          partnerTag: config.tag,
          resources: RESOURCES,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch {
      if (attempt === MAX_RETRIES) {
        return { items: [], errors: new Map(), fatal: 'Network error calling the Creators API.' }
      }
      await sleep(800 * 2 ** attempt)
      continue
    }

    const body = await readJson(response)

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500
      // An expired token is worth exactly one refresh, then a retry.
      if (response.status === 401) {
        tokenCache = null
        if (attempt < MAX_RETRIES) continue
      }
      if (retryable && attempt < MAX_RETRIES) {
        const retryAfter = Number(response.headers.get('retry-after'))
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 800 * 2 ** attempt
        await sleep(wait)
        continue
      }
      return { items: [], errors: new Map(), fatal: apiErrorMessage(response.status, body) }
    }

    const result = (body ?? {}) as Record<string, unknown>
    // The reference and the offersV2 page name this `itemResults`; the
    // using-cURL sample names it `itemsResult`. Accept either spelling rather
    // than silently returning nothing for every ASIN.
    const itemResults = (result.itemResults ?? result.itemsResult ?? {}) as Record<string, unknown>
    const rawItems = Array.isArray(itemResults.items) ? (itemResults.items as Record<string, unknown>[]) : []
    const rawErrors = Array.isArray(result.errors) ? (result.errors as Record<string, unknown>[]) : []

    const errors = new Map<string, string>()
    for (const entry of rawErrors) {
      const code = typeof entry.code === 'string' ? entry.code : 'Error'
      const message = typeof entry.message === 'string' ? entry.message : ''
      // Amazon names the failing id inside the message; map it to the ASIN when
      // it appears so the per-ASIN result can explain the gap.
      const matched = asinBatch.find((asin) => message.includes(asin))
      if (matched) errors.set(matched, `${code}: ${message}`.replace(/\s+/g, ' ').trim())
    }

    return {
      items: rawItems.filter((item) => typeof item?.asin === 'string').map((item) => toItem(item, fetchedAt)),
      errors,
    }
  }

  return { items: [], errors: new Map(), fatal: 'Creators API request failed after retries.' }
}

/**
 * Fetch up to any number of ASINs, batched 10 per documented GetItems call.
 * Never throws: a missing configuration, throttling or a bad request yields
 * one result per requested ASIN with `error` set.
 */
export async function getItems(asins: string[]): Promise<AmazonItem[]> {
  const requested = [...new Set(asins.map((asin) => asin.trim().toUpperCase()).filter((asin) => ASIN_PATTERN.test(asin)))]
  if (requested.length === 0) return []

  const config = readConfig()
  if (!config) {
    return requested.map((asin) => blankItem(asin, 'Amazon Creators API credentials are not configured.'))
  }
  if (!tokenEndpointFor(config.version)) {
    return requested.map((asin) => blankItem(asin, 'Unknown AMAZON_CREATORS_CREDENTIAL_VERSION.'))
  }

  const now = Date.now()
  const results = new Map<string, AmazonItem>()
  const stale: string[] = []

  for (const asin of requested) {
    const cached = recordCache.get(asin)
    if (cached && cached.expiresAt > now) results.set(asin, cached.item)
    else stale.push(asin)
  }

  for (let start = 0; start < stale.length; start += MAX_ASINS_PER_CALL) {
    const batch = stale.slice(start, start + MAX_ASINS_PER_CALL)
    try {
      const outcome = await callGetItems(batch, config)
      for (const item of outcome.items) {
        if (item.asin && batch.includes(item.asin)) {
          results.set(item.asin, item)
          recordCache.set(item.asin, { item, expiresAt: Date.now() + RECORD_TTL_MS })
        }
      }
      for (const asin of batch) {
        if (results.has(asin)) continue
        const reason = outcome.errors.get(asin) ?? outcome.fatal ?? 'No item data returned by the Creators API.'
        results.set(asin, blankItem(asin, reason))
      }
    } catch {
      // Defensive: callGetItems already catches, but a page render must never see a throw.
      for (const asin of batch) {
        if (!results.has(asin)) results.set(asin, blankItem(asin, 'Creators API request failed.'))
      }
    }
  }

  return requested.map((asin) => results.get(asin) ?? blankItem(asin, 'No item data returned.'))
}

/** Fetch a single ASIN; null-safe convenience wrapper. */
export async function getItem(asin: string): Promise<AmazonItem | null> {
  const [item] = await getItems([asin])
  return item ?? null
}

function blankItem(asin: string, error: string): AmazonItem {
  return {
    asin,
    title: null,
    price: null,
    currency: null,
    availability: null,
    listPrice: null,
    fetchedAt: new Date().toISOString(),
    error,
  }
}
