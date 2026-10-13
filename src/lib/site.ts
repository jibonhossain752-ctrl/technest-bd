/**
 * THE single source of truth for the site's identity and market.
 *
 * Brand name, canonical domain, locale, currency and country all live here so
 * no page, component or data file has to spell them out again. Anything that
 * says "GadgetErea", "gadgeterea.com", "en-US", "USD" or "United States"
 * should read it from this file.
 *
 * Adding a new page? Import SITE_URL / BRAND_NAME from here instead of typing
 * the domain, and read the currency/country from here instead of hardcoding
 * "$" or "US" copy.
 */

export const SITE = {
  /** Brand name as it appears in titles, footer and JSON-LD. */
  brand: 'GadgetErea',
  /** Canonical host, without the protocol. */
  domain: 'gadgeterea.com',
  /** Canonical origin — every absolute URL the site emits starts here. */
  url: 'https://gadgeterea.com',
  /** BCP 47 locale for <html lang> and Open Graph. */
  locale: 'en-US',
  /** ISO 4217 currency code used by display helpers and schema. */
  currency: 'USD',
  /** ISO 3166-1 alpha-2 country the storefront is written for. */
  country: 'US',
  /** Human-readable country name for copy that needs it. */
  countryName: 'United States',
  /** Currency symbol used by display helpers. */
  currencySymbol: '$',
  /** Amazon Associates disclosure. Shown with plain visible text, never hidden. */
  amazonDisclosure: 'As an Amazon Associate we earn from qualifying purchases.',
} as const

/** Canonical origin, e.g. `https://gadgeterea.com`. */
export const SITE_URL: string = SITE.url

/** Brand name, e.g. `GadgetErea`. */
export const BRAND_NAME: string = SITE.brand

/** True only when a disclaimer should be attached to a quoted price. */
export const PRICE_DISCLAIMER =
  'Prices on Amazon change often. Check the listing for the current price.'

/**
 * Label for every "buy" call to action on the site. Amazon prices move
 * constantly, so the button never carries a number unless the data stores one
 * together with the date it was checked.
 */
export const AFFILIATE_CTA = 'Check current price on Amazon'

/**
 * A price is only ever displayable when it was verified on a known date. The
 * site stores prices without a check date, so this returns null for them and
 * the UI shows the call to action alone rather than a number that may be stale.
 *
 * `checkedOn` must be an ISO 'YYYY-MM-DD' date read from data — never today's
 * date, which would present an unverified amount as freshly confirmed.
 */
export function datedPrice(price: number | null | undefined, checkedOn?: string): string | null {
  if (price == null || !checkedOn) return null
  const parsed = new Date(checkedOn)
  if (Number.isNaN(parsed.getTime())) return null
  return `${formatUSD(price)} as of ${checkedOn}`
}

/** Currency display helper — the one place that formats money. */
export function formatUSD(value: number | null | undefined): string {
  return value == null ? 'Price unavailable' : `${SITE.currencySymbol}${value.toLocaleString(SITE.locale)}`
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Affiliate link attributes required on every outbound Amazon link. */
export const AFFILIATE_LINK_ATTRS = {
  target: '_blank' as const,
  rel: 'sponsored nofollow noopener' as const,
}
