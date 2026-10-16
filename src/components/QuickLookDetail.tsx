'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/data/products'
import type { QuickLookEntry } from '@/data/quick-look'
import { AFFILIATE_CTA, AFFILIATE_LINK_ATTRS, SITE } from '@/lib/site'
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
 * The spec-sheet half of a Quick Look page, ported from the source project's
 * detail layout: highlight strip, gallery with its thumbnail rail, variant
 * selector, the purchase panel, key specifications, additional info and the
 * full grouped specification cards underneath.
 *
 * Rules this component follows (see memory.md):
 * - The product's full catalog record is the source for every visible fact.
 *   Nothing here is invented, and no spec row is rendered unless the data layer
 *   supplies it.
 * - One purchase call to action only, and no price anywhere on the page. The
 *   cart, checkout and "buy now" paths of the source page are deliberately not
 *   ported: this store sells nothing on site, so every purchase is the single
 *   outbound Amazon link.
 * - The affiliate link carries rel="sponsored nofollow noopener" and opens in a
 *   new tab (TrackedAffiliateLink handles both plus the click event).
 * - Exactly one Amazon Associates disclosure sits beside the buy button, in
 *   plain visible text; the guide below does not repeat it.
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
          <div className="ql-panels">
            {/* Variant selector. Informational only: this store shows no price,
                so choosing an option never changes a figure. */}
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
                      {group.options.map((option, optionIndex) => (
                        <button
                          key={option.label}
                          type="button"
                          className={
                            (selected[groupIndex] ?? 0) === optionIndex
                              ? 'ql-chip active'
                              : 'ql-chip'
                          }
                          onClick={() =>
                            setSelected((current) =>
                              current.map((value, index) =>
                                index === groupIndex ? optionIndex : value,
                              ),
                            )
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {group.options[selected[groupIndex] ?? 0]?.note && (
                      <p className="ql-variant-note">
                        {group.options[selected[groupIndex] ?? 0]?.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Purchase panel — the source page's price card is replaced here by
                the single outbound Amazon button, one plain line explaining why
                there is no figure, and the one visible disclosure line. No
                price number, no strike-through price, no store lines.

                An INFORMATIONAL entry (see QuickLookEntry.informational) renders
                no purchase panel at all: no store button, no price note and no
                affiliate disclosure, because there is nothing to buy and no
                listing to point at. In its place is a plain note saying so —
                visible text only, never a link. */}
            {entry.informational ? (
              <div className="ql-panel ql-buy-panel">
                <h2 className="ql-panel-title">A spec sheet, not a store listing</h2>
                <p className="ql-buy-note">
                  {entry.displayName} is an Apple product this store does not sell, so there is no
                  buy button and no shop link on this page. The dollar figures in the guide below are
                  Apple’s own announced US launch prices, dated to its announcement and marked as
                  before tax and shipping.
                </p>
              </div>
            ) : (
              <div className="ql-panel ql-buy-panel">
                {product.buyUrl ? (
                  <TrackedAffiliateLink
                    href={product.buyUrl}
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
                    {AFFILIATE_CTA} ↗
                  </TrackedAffiliateLink>
                ) : (
                  <Link href={`/product/${product.slug}`} className="btn btn-accent ql-buy-btn">
                    View the product page
                  </Link>
                )}
                <p className="ql-buy-note">
                  Amazon prices change often, so check the current price on the listing.
                </p>
                {/* The one visible disclosure next to the buy button. The guide
                    below does NOT repeat it — the site-wide footer carries the
                    site's other copy of this line. */}
                <p className="ql-disclosure">{SITE.amazonDisclosure}</p>
              </div>
            )}
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
