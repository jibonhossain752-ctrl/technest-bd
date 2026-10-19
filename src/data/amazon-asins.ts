/**
 * Amazon ASIN registry — one entry per slug the site can enrich with
 * Creators API data.
 *
 * Keys are Shop product slugs (src/data/products.ts). A Quick Look entry that
 * is not a catalog product keys on its own Quick Look slug
 * (src/data/quick-look.ts), so a product that appears in both places has ONE
 * entry here. 48 slugs total: 35 Shop products + 13 Quick Look-only entries.
 *
 * `source` records where the ASIN came from:
 *   'owner'    — supplied by the site owner.
 *   'redirect' — read from the Location header of the product's existing
 *                amzn.to link (one request, redirects not followed). No Amazon
 *                product page was fetched.
 *   null       — unknown.
 *
 * ASINs are data, not secrets, and Amazon allows storing them indefinitely.
 * Prices/ratings are NOT stored here — they belong to the API client and its
 * cache (src/lib/amazon-creators.ts).
 *
 * UNCONFIRMED marks an ASIN whose listing title has not yet been matched
 * against our product name. Until the Creators API title check runs, treat
 * every entry as unconfirmed.
 */

export type AsinSource = 'owner' | 'redirect' | null

export interface AmazonAsinEntry {
  asin: string | null
  source: AsinSource
  note?: string
}

const owner = (asin: string, note: string): AmazonAsinEntry => ({ asin, source: 'owner', note })
const redirect = (asin: string, note = 'ASIN read from the amzn.to Location header'): AmazonAsinEntry => ({
  asin,
  source: 'redirect',
  note,
})
const unknown = (note: string): AmazonAsinEntry => ({ asin: null, source: null, note })

export const AMAZON_ASINS: Record<string, AmazonAsinEntry> = {
  /* ── Owner-supplied ASINs ──────────────────────────────────────────── */
  'aula-f75-pro-wireless-keyboard': owner(
    'B0D14N2QZF',
    'Owner-supplied; the amzn.to link resolves to the same ASIN. Title unconfirmed.',
  ),
  'ugreen-usb-c-hub-5-in-1': owner(
    'B0BR3M8XHK',
    'Owner-supplied; the amzn.to link resolves to the same ASIN. Title unconfirmed.',
  ),
  'playstation-5-disc-console-slim': owner(
    'B0CL61F39H',
    'Owner-supplied; the amzn.to link resolves to the same ASIN. Title unconfirmed.',
  ),
  'samsung-galaxy-z-fold7-256gb': owner(
    'B0F7JZYWLL',
    'Owner-supplied; the amzn.to link resolves to the same ASIN. Title unconfirmed.',
  ),
  'xiaomi-redmi-watch-5': owner(
    'B0DFZPR9Z4',
    'Owner-supplied; the amzn.to link resolves to the same ASIN, but that listing is titled "Redmi Watch Active". UNCONFIRMED — may be a different model.',
  ),
  'lenovo-ideacentre-aio-27': owner(
    'B0H6FHLHTN',
    'Owner-supplied; the amzn.to link resolves to the same ASIN, but that listing is a "Qehi Desktop Computer", not a Lenovo. UNCONFIRMED.',
  ),
  'asus-vivobook-15-x1504va': owner(
    'B0GYMRPNVJ',
    'Owner-supplied; the amzn.to link resolves to the same ASIN, but that listing is an E1504FA, not the X1504VA. UNCONFIRMED.',
  ),
  'apple-ipad-air-11-m3': owner(
    'B0DZ78Q48C',
    'Owner-supplied; the amzn.to link resolves to the same ASIN, but that listing is an Apple Magic Keyboard for the 11-inch iPad Air, not an iPad. UNCONFIRMED.',
  ),
  'vivo-x300-pro': owner(
    'B0G5QL8TLH',
    'Owner-supplied; the amzn.to link resolves to the same ASIN (a vivo X300 Pro listing). Title unconfirmed.',
  ),
  'apple-iphone-17-pro-max': owner(
    'B0FTCWXD9K',
    'Owner-supplied; the amzn.to link resolves to the same ASIN, but that listing is the "Renewed" (refurbished) iPhone 17 Pro Max while the page covers the new phone. UNCONFIRMED.',
  ),
  'anker-soundcore-r50i': unknown(
    'Owner gave no ASIN; their link is an Amazon search page, which reveals no ASIN.',
  ),
  'honor-robot-phone': unknown(
    'Owner gave no ASIN; their link is an Amazon search page, which reveals no ASIN.',
  ),

  /* ── ASINs resolved from the existing amzn.to links (Shop products) ── */
  '140w-smart-auto-stop-charger': redirect('B0GYZCTWTW'),
  'beats-360-wireless-headphones': redirect('B0HC11K9C1'),
  'cio-smartcoby-ultra-slim-power-bank': redirect('B0FTZ596XR'),
  'cyberpower-cp1500pfclcd-ups': redirect('B00429N19W'),
  'echo-dot-5th-gen-charcoal': redirect('B09B8V1LZ3'),
  'emeet-c960-4k-webcam': redirect('B0CJHZ92P6'),
  'eurosteam-step-up-steam-iron': redirect('B0F47CGZST'),
  'forward-x-ovis-auto-follow-suitcase': redirect('B088D5VVM6'),
  'goldjoy-7-in-1-speaker-charging-station': redirect('B0GT8VQ4ZP'),
  'hibbent-1080-faucet-extender': redirect('B0BP7MCL3P'),
  'jack-rose-k1-travel-steamer': redirect('B0CF88RN17'),
  'jinraiko-overhead-camera-mount': redirect('B0FFNCCJMQ'),
  'kids-echo-dot-5th-gen-owl': redirect('B09B9CD1YB'),
  'level8-luminous-carry-on-luggage': redirect('B07MXF4G8K'),
  'level8-zipperless-carry-on-luggage': redirect('B0CRTZPVBV'),
  'libernovo-omni-pro-office-chair': redirect('B0GYY8JM1L'),
  'logitech-lift-vertical-mouse': redirect('B09J1TB35S'),
  'mixi-carry-on-luggage-charger': redirect('B0CF5NSKW2'),
  'mova-lidax-ultra-2000': redirect('B0G3CBW2H8'),
  'narshton-open-ear-headphones': redirect('B0GWMPM464'),
  'obsbot-tiny-2-lite-webcam': unknown(
    'The amzn.to link answers with a 302 to the amazon.com homepage and reveals no ASIN.',
  ),
  'quntis-computer-monitor-lamp': redirect('B08DKQ3JG1'),
  'rayneo-air-4-pro-batman-justice': redirect('B0GF6BTC1S'),
  'samsung-galaxy-z-flip8-256gb': redirect('B0H12NWT53'),
  'scanfield-under-desk-cable-tray': redirect('B09J5HH2LR'),
  'singer-intelligent-steam-press': redirect('B0FSGNSM34'),
  'sony-wh-1000xm5-headphones': redirect('B09XS7JWHH'),
  'taketoday-collapsible-water-bottle': redirect('B0C58GZHRX'),
  'torras-ostand-q3-air-iphone-17-pro-case': redirect('B0FGCB5QMJ'),
  'ueq-foldable-3-in-1-charging-station': redirect('B0DK4VM1SX'),
  'xvolt-electric-heated-lunch-box': redirect('B0GZM2K1NX'),

  /* ── Quick Look-only entries ───────────────────────────────────────── */
  'apple-airpods-pro-3': redirect('B0DGHWD7CT'),
  'apple-homeview-smart-display': unknown(
    'Informational Quick Look entry: it has no buy link, so no ASIN could be resolved.',
  ),
  'dji-osmo-action-5-pro': redirect('B0DS2B3P2B'),
  'samsung-galaxy-s26-ultra': redirect('B0G4SW3XXP'),
  'samsung-galaxy-tab-s10-ultra': redirect('B0D84MHZX5'),
}

/** Look up an ASIN; returns undefined for an unknown slug, null for a known gap. */
export function getAsin(slug: string): string | null | undefined {
  return AMAZON_ASINS[slug]?.asin
}

/** ASINs plus the slugs they belong to, skipping the gaps. */
export function asinsForSlugs(slugs: string[]): { slug: string; asin: string }[] {
  return slugs.flatMap((slug) => {
    const asin = AMAZON_ASINS[slug]?.asin
    return asin ? [{ slug, asin }] : []
  })
}
