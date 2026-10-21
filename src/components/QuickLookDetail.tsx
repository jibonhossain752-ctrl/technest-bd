'use client'

import { useState } from 'react'
import type { Product } from '@/data/products'
import type { QuickLookEntry, QuickLookVariant } from '@/data/quick-look'
import { AFFILIATE_LINK_ATTRS, SITE } from '@/lib/site'
import TrackedAffiliateLink from './TrackedAffiliateLink'
import QuickLookGallery from './QuickLookGallery'

interface QuickLookDetailProps {
  product: Product
  entry: QuickLookEntry
  /** Gallery images (product photo first). */
  images: string[]
  /** Position-matched alt per image, from src/lib/imageAlt.ts. */
  imageAlts: string[]
}

/**
 * FEATURE FLAG — availability pills under the product title. Ported from the
 * source page, where it is currently OFF: the row overflowed on small screens
 * and its information is already carried elsewhere on the page.
 *
 * Adapted on purpose: the source row also carried an "Official Warranty" pill.
 * This store never publishes a warranty term taken from a listing (see
 * memory.md), so the flagged row carries availability and the model version
 * only. Flip to true to restore the row.
 */
const SHOW_AVAILABILITY_BADGES = false

/**
 * The price box's placeholder, shown on every page without a `priceBox`.
 * One constant on purpose: change the wording here and it changes everywhere.
 */
export const NO_PRICE_LABEL = 'No price listed'

/** ISO date (YYYY-MM-DD) → "October 19, 2026". UTC-pinned so the server and
 *  the browser always render the same string. */
function formatPriceDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(SITE.locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Two-column key/value rows — label left, value right, long values wrap in their own column. */
function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="ql-kv">
      <span className="ql-kv-label">{label}</span>
      <span className="ql-kv-value">{value}</span>
    </div>
  )
}

/** Bullet list used by spec groups that read as items rather than pairs. */
function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="ql-list cross">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * Whether one option is unavailable for the current selection: an option may
 * carry `disabledWhen`, naming another dimension and the options that rule it
 * out (HomeView's Starlight and Rose Pink under the wall-mounted model).
 * Pure, so the render and the fallback below always agree.
 */
function optionBlocked(
  groups: QuickLookVariant[],
  selection: number[],
  groupIndex: number,
  optionIndex: number,
): boolean {
  const condition = groups[groupIndex]?.options[optionIndex]?.disabledWhen
  if (!condition) return false
  const otherIndex = groups.findIndex((group) => group.label === condition.group)
  if (otherIndex < 0) return false
  const current = groups[otherIndex]?.options[selection[otherIndex] ?? 0]?.label
  return typeof current === 'string' && condition.options.includes(current)
}

/**
 * The spec-sheet half of a Quick Look page, ported from the source project's
 * detail layout: highlight strip, gallery with its thumbnail rail, variant
 * selector, the purchase panel, key specifications, additional info and the
 * full grouped specification cards underneath.
 *
 * Rules this component follows (see memory.md):
 * - The product's full catalog record is the source for every visible fact.
 *   Nothing here is invented, and no spec row is rendered unless the data layer
 *   supplies it.
 * - Two separate things live in the right-hand column: a PRICE BOX on every
 *   page, and (only where the page has an Amazon link) one full-width buy
 *   button below the key specifications. The cart, checkout and one-tap
 *   purchase paths of the source page are deliberately not ported: this store
 *   sells nothing on site, so every purchase is the single outbound Amazon link.
 * - A price figure renders only through `entry.priceBox` (a manual figure from
 *   the manufacturer or its own store, with its source and date). A page
 *   carrying one has no Amazon link — see memory.md rule 3 and the build guard.
 * - The affiliate link carries rel="sponsored nofollow noopener" and opens in a
 *   new tab (TrackedAffiliateLink handles both plus the click event).
 * - Exactly one Amazon Associates disclosure sits under the buy button, in
 *   plain visible text; the guide below does not repeat it, and a page with no
 *   Amazon link renders no disclosure at all.
 * - The Spec Score badge is a completeness indicator, not a rating, and never
 *   reaches the structured data.
 */
export default function QuickLookDetail({
  product,
  entry,
  images,
  imageAlts,
}: QuickLookDetailProps) {
  const variantGroups = entry.variants ?? []
  const [selected, setSelected] = useState<number[]>(() => variantGroups.map(() => 0))

  /**
   * Select an option, then repair any other dimension the choice just made
   * unavailable: it falls to the first option that is still offered (HomeView's
   * colour falls back to Silver when the wall-mounted model is chosen).
   */
  const selectOption = (groupIndex: number, optionIndex: number) =>
    setSelected((current) => {
      const next = current.map((value, index) => (index === groupIndex ? optionIndex : value))
      return next.map((value, index) => {
        if (!optionBlocked(variantGroups, next, index, value)) return value
        const fallback = variantGroups[index].options.findIndex(
          (_, candidate) => !optionBlocked(variantGroups, next, index, candidate),
        )
        return fallback >= 0 ? fallback : value
      })
    })

  // A page whose variants have their own picture maps the current combination
  // to a gallery image already on the page (entry.variantImages). A page without
  // the map resolves to undefined, and the gallery behaves as it always has.
  const selectionKey = variantGroups
    .map((group, index) => group.options[selected[index] ?? 0]?.label ?? '')
    .join(' + ')
  const selectedVariantImage = entry.variantImages?.[selectionKey]

  // Deterministic Spec Score: the share of this entry's spec fields that are
  // actually filled in, not a rating and not invented data.
  const filled = [
    entry.highlights.length >= 3,
    entry.keySpecs.length >= 5,
    entry.additionalInfo.length >= 4,
    variantGroups.length > 0,
    entry.specs.length >= 4,
    entry.specs.every((group) => (group.rows?.length ?? 0) > 0 || (group.items?.length ?? 0) > 0),
  ].filter(Boolean).length
  const specScore = Math.round((filled / 6) * 100)

  const heroAlt = imageAlts[0] ?? product.name
  const priceBox = entry.priceBox
  // The buy row exists only on a page that has an Amazon link. An informational
  // entry never does; the guard fails the build if it gains one, or if a page
  // with a price box gains a link at all.
  const buyUrl = entry.informational ? null : product.buyUrl

  return (
    <article className="container ql-detail">
      <div className="ql-titleblock">
        {/* The title block opens the page: the ported crumb row was removed on
            purpose (memory.md rule 4c), so no trail is rendered here. Its space
            lives in `.ql-detail`'s top padding now, which is why the padding is
            larger than the rest of the section's spacing. Do not re-add a
            trail — navigation is the guide's "Keep exploring" links. */}
        <h1 className="ql-title">{entry.displayName}: Specs, Features and Buying Guide</h1>
        <p className="ql-lede">{product.description}</p>

        {product.features.length > 0 && (
          <ul className="ql-highlights">
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}
      </div>

      {SHOW_AVAILABILITY_BADGES && (
        <div className="ql-pills">
          <span className="ql-pill accent">
            {entry.status === 'upcoming' ? '◌ Upcoming' : '● In Stock'}
          </span>
          <span className="ql-pill">{entry.displayName}</span>
        </div>
      )}

      {/* Highlight strip — the five scanned-first facts. Desktop only, as in
          the source layout, where the same facts repeat in the panels below. */}
      {entry.highlights.length > 0 && (
        <div className="ql-highlight-grid">
          {entry.highlights.map((highlight) => (
            <div className="ql-highlight-card" key={highlight.label}>
              <span className="ql-highlight-value">{highlight.value}</span>
              <span className="ql-highlight-label">{highlight.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ql-hero">
        <div className="ql-hero-media">
          <QuickLookGallery
            images={images}
            alts={imageAlts}
            productName={product.name}
            fallbackEmoji={product.image}
            altFallback={heroAlt}
            specScore={specScore}
            selectedImage={selectedVariantImage}
          />
          {/* An informational page shows renders rather than the manufacturer's
              photographs, so the gallery says so under the image. Text only —
              no badge, no banner. */}
          {entry.informational && (
            <p className="ql-spec-source">
              The images above are illustrations based on the design Apple announced on
              October 13, 2026, not photographs of a shipping unit.
            </p>
          )}
        </div>

        <div className="ql-info">
          {/* Variant + price share the row on wide screens, as in the source
              layout. A page with no variant dimension gives the price box the
              whole row instead of leaving an empty half-width box. */}
          <div className={variantGroups.length > 0 ? 'ql-panels' : 'ql-panels single'}>
            {/* Variant selector. It can change the gallery image on a page whose
                entry maps the combination (entry.variantImages); it never
                changes the price box, whose figures are the manufacturer's own
                published ones. */}
            {variantGroups.length > 0 && (
              <div className="ql-panel">
                <h2 className="ql-panel-title">Choose variant</h2>
                {variantGroups.map((group, groupIndex) => (
                  <div className="ql-variant-group" key={group.label}>
                    <div className="ql-variant-label">
                      {group.label}:{' '}
                      <span className="ql-variant-current">
                        {group.options[selected[groupIndex] ?? 0]?.label}
                      </span>
                    </div>
                    <div className="ql-variant-chips">
                      {group.options.map((option, optionIndex) => {
                        const blocked = optionBlocked(
                          variantGroups,
                          selected,
                          groupIndex,
                          optionIndex,
                        )
                        return (
                          <button
                            key={option.label}
                            type="button"
                            className={
                              (selected[groupIndex] ?? 0) === optionIndex
                                ? 'ql-chip active'
                                : 'ql-chip'
                            }
                            onClick={() => selectOption(groupIndex, optionIndex)}
                            disabled={blocked}
                            aria-disabled={blocked || undefined}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    {/* One caption for the whole dimension when the data gives
                        one, otherwise the selected option's own note. */}
                    {(group.note ?? group.options[selected[groupIndex] ?? 0]?.note) && (
                      <p className="ql-variant-note">
                        {group.note ?? group.options[selected[groupIndex] ?? 0]?.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Price box — the page's ONE price surface, on every Quick Look
                page. A figure appears only when the entry carries `priceBox`:
                a price the owner typed in by hand, shipped with its source and
                `asOf` date. Price + buy link allowed together by owner
                decision on 2026-10-21. Prices are hand-entered and may be out
                of date, which is what the source line says.

                A page priced per variant leaves `amount` out and puts one row
                per variant in `rows`; its neutral `label` then takes the
                headline slot. Without `priceBox` the box still renders, with
                one muted line: the NO_PRICE_LABEL constant above. */}
            <div className="ql-panel ql-price-panel">
              <h2 className="ql-panel-title">Price</h2>
              {priceBox ? (
                <>
                  {/* A page priced per variant has no single figure: its
                      neutral `label` (e.g. "Prices by storage capacity") takes
                      the headline slot and every variant keeps its own row. */}
                  <p className="ql-price-amount">{priceBox.amount ?? priceBox.label}</p>
                  {priceBox.amount && <p className="ql-price-label">{priceBox.label}</p>}
                  <p className="ql-price-asof">
                    as of{' '}
                    <time dateTime={priceBox.asOf}>{formatPriceDate(priceBox.asOf)}</time>
                  </p>
                  <p className="ql-price-source">Source: {priceBox.source}</p>
                  {priceBox.rows && priceBox.rows.length > 0 && (
                    <ul className="ql-price-rows">
                      {priceBox.rows.map((row) => (
                        <li className="ql-price-row" key={row.label}>
                          <span className="ql-price-row-label">
                            {row.label}
                            {row.note && <span className="ql-price-row-note">{row.note}</span>}
                          </span>
                          <span className="ql-price-row-amount">{row.amount}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {priceBox.note && <p className="ql-price-note">{priceBox.note}</p>}
                  {/* The informational page's plain note (memory.md rule 4e):
                      text only, never a link. It says why there is no button. */}
                  {entry.informational && (
                    <p className="ql-price-caption">
                      This store does not sell {entry.displayName}, so this page has no buy
                      button.
                    </p>
                  )}
                </>
              ) : (
                <p className="ql-price-empty">{NO_PRICE_LABEL}</p>
              )}
            </div>
          </div>

          {entry.keySpecs.length > 0 && (
            <div className="ql-panel">
              <h2 className="ql-panel-title">Key specifications</h2>
              <div className="ql-kv-list">
                {entry.keySpecs.map((row) => (
                  <KeyValue key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          )}

          {/* Buy row — only where the page has an Amazon link, and never on a
              page that shows a manual price (the guard enforces the pair).
              Full width, one button, the required Associates line beneath it. */}
          {buyUrl && (
            <div className="ql-buy-row">
              <TrackedAffiliateLink
                href={buyUrl}
                className="btn btn-accent ql-buy-btn"
                // Affiliate links must be sponsored and nofollowed, in a new
                // tab. Passing them here (rather than relying on the shared
                // component's default rel) keeps this rule explicit at the one
                // place the Quick Look section sends traffic to Amazon.
                target={AFFILIATE_LINK_ATTRS.target}
                rel={AFFILIATE_LINK_ATTRS.rel}
                meta={{
                  product_slug: product.slug,
                  product_name: product.name.slice(0, 200),
                  location: 'quick-look',
                }}
              >
                Buy from Amazon <span aria-hidden="true">↗</span>
              </TrackedAffiliateLink>
              {/* The one visible disclosure on the page. The guide below does
                  NOT repeat it; a page with no Amazon link renders none. */}
              <p className="ql-disclosure">{SITE.amazonDisclosure}</p>
            </div>
          )}

          {entry.additionalInfo.length > 0 && (
            <div className="ql-panel">
              <h2 className="ql-panel-title">Additional info</h2>
              <div className="ql-kv-list">
                {entry.additionalInfo.map((row) => (
                  <KeyValue key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="ql-specs" aria-labelledby="ql-specs-heading">
        <h2 id="ql-specs-heading">{entry.displayName} specifications</h2>
        <div className="ql-spec-grid">
          {entry.specs.map((group) => (
            <div className="ql-spec-card" key={group.group}>
              <h3>{group.group}</h3>
              {group.rows && group.rows.length > 0 && (
                <table className="ql-spec-table">
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={`${group.group}-${row.label}`}>
                        <th scope="row">{row.label}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {group.items && group.items.length > 0 && <ItemList items={group.items} />}
            </div>
          ))}
        </div>
        <p className="ql-spec-source">Specs checked against {entry.specSource}.</p>
      </section>
    </article>
  )
}
