import Link from 'next/link'
import type { Product } from '@/data/products'
import type { QuickLookEntry } from '@/data/quick-look'
import { productImageAlt } from '@/lib/imageAlt'
import { SITE, AFFILIATE_CTA, AFFILIATE_LINK_ATTRS, datedPrice } from '@/lib/site'
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
 * The spec-sheet half of a Quick Look page: gallery, the page's single H1,
 * the listing's own highlight bullets, one buy call to action, and the grouped
 * spec table underneath.
 *
 * Rules this component follows (see memory.md):
 * - The product's full catalog record is the source for every visible fact.
 *   Nothing here is invented, and no spec row is rendered unless the data layer
 *   supplies it.
 * - No price is ever printed. The call to action says "Check current price on
 *   Amazon" because Amazon prices move; a number would be stale the day after
 *   it was written. When a dated, verified price exists, `datedPrice` renders
 *   it with its "as of" date instead.
 * - The affiliate link carries rel="sponsored nofollow noopener" and opens in a
 *   new tab (TrackedAffiliateLink handles both plus the click event).
 * - The Amazon Associates disclosure sits immediately next to the first buy
 *   button, in plain visible text.
 */
export default function QuickLookDetail({
  product,
  entry,
  images,
  imageAlts,
}: QuickLookDetailProps) {
  const verifiedPrice = datedPrice(product.price, entry.priceCheckedOn)
  const heroAlt = imageAlts[0] ?? productImageAlt(product)

  return (
    <article className="container ql-detail">
      <div className="ql-hero">
        <QuickLookGallery
          images={images}
          alts={imageAlts}
          productName={product.name}
          fallbackEmoji={product.image}
          altFallback={heroAlt}
        />

        <div className="ql-info">
          <p className="ql-crumbs">
            <Link href="/quick-look">Quick Look</Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/shop/${product.categorySlug}`}>{product.category}</Link>
          </p>

          <h1 className="ql-title">{entry.displayName}: Specs, Features and Buying Guide</h1>

          <p className="ql-lede">{product.description}</p>

          {product.features.length > 0 && (
            <ul className="ql-highlights">
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}

          <div className="ql-buy">
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

            {verifiedPrice ? (
              <p className="ql-price-note">
                {verifiedPrice}. {SITE.brand} shows a price only when it was checked on a known
                date.
              </p>
            ) : (
              <p className="ql-price-note">
                No price is shown here on purpose — Amazon prices change constantly, so the
                listing is the only place a current figure is accurate.
              </p>
            )}
          </div>

          <p className="ql-disclosure">{SITE.amazonDisclosure}</p>

          {product.warranty && (
            <p className="ql-warranty">Warranty stated on the listing: {product.warranty}.</p>
          )}
        </div>
      </div>

      <section className="ql-specs" aria-labelledby="ql-specs-heading">
        <h2 id="ql-specs-heading">{entry.displayName} specifications</h2>
        <div className="ql-spec-grid">
          {entry.specs.map((group) => (
            <div className="ql-spec-card" key={group.group}>
              <h3>{group.group}</h3>
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
            </div>
          ))}
        </div>
        <p className="ql-spec-source">Specs checked against {entry.specSource}.</p>
      </section>
    </article>
  )
}
