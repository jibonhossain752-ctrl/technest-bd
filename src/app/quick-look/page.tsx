import type { Metadata } from 'next'
import { getQuickLookCatalog } from '@/data/quick-look'
import { SITE, SITE_URL } from '@/lib/site'
import Breadcrumb from '@/components/ui/Breadcrumb'
import QuickLookCard from '@/components/QuickLookCard'
import ViewAllButton from '@/components/ViewAllButton'

/**
 * Quick Look listing — the index of spec sheets.
 *
 * Entries come from the Quick Look data layer, which only lists products that
 * actually have a spec sheet written, so this grid can never link to a page
 * that does not exist.
 *
 * SEO plumbing: one H1 carrying the section's primary keyword, a self-referencing
 * canonical, matching Open Graph / Twitter copy, and a visible intro paragraph.
 * The section is listed in src/lib/sitemap-routes.ts so it reaches sitemap.xml.
 */

export const metadata: Metadata = {
  title: 'Quick Look: Gadget Specs & Reviews',
  description:
    'Quick Look spec sheets for popular gadgets: grouped specifications, key features explained, who each product suits and a link to check the current Amazon price.',
  alternates: { canonical: `${SITE_URL}/quick-look` },
  openGraph: {
    title: `Quick Look: Gadget Specs & Reviews | ${SITE.brand}`,
    description:
      'Quick Look spec sheets for popular gadgets: grouped specifications, key features explained and who each product suits.',
    url: `${SITE_URL}/quick-look`,
    siteName: SITE.brand,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `Quick Look: Gadget Specs & Reviews | ${SITE.brand}`,
    description:
      'Quick Look spec sheets for popular gadgets: grouped specifications, key features explained and who each product suits.',
  },
}

export default function QuickLookListingPage() {
  const catalog = getQuickLookCatalog()

  return (
    <>
      <div className="container">
        <div className="category-seo-head">
          <Breadcrumb crumbs={[{ label: 'Quick Look' }]} />
          <h1>Quick Look: Gadget Specs and Buying Guides</h1>
          <p className="category-seo-intro">
            Quick Look pages put one product under the microscope: the specifications grouped by
            category, what each feature means in daily use, who the product suits and who should
            skip it, and honest buying advice before you check the price on Amazon.
          </p>
        </div>
      </div>

      <section className="section ql-listing">
        <div className="container">
          {catalog.length === 0 ? (
            <p className="ql-empty">
              No spec sheets are published yet. Browse the shop in the meantime.
            </p>
          ) : (
            <div className="product-grid">
              {catalog.map(({ entry, product }) => (
                <QuickLookCard key={product.slug} product={product} entry={entry} />
              ))}
            </div>
          )}

          <ViewAllButton href="/shop" label="Browse the full shop" />
        </div>
      </section>
    </>
  )
}
