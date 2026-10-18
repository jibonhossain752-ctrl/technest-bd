import type { Metadata } from 'next'
import { getQuickLookCatalog } from '@/data/quick-look'
import { SITE, SITE_URL } from '@/lib/site'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PageIntro from '@/components/ui/PageIntro'
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
    'Quick Look spec sheets for popular gadgets: grouped specifications, key features explained, who each product suits and where the published figures came from.',
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
          <PageIntro
            title="Quick Look: Gadget Specs and Buying Guides"
            description="Quick Look pages put one popular gadget under the microscope — specs, what each feature means and who it suits."
          />
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
