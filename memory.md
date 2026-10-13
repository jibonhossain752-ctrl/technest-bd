# GadgetErea — memory

Standing rules and decisions for this repository. Read before adding pages,
products, posts or sections.

## Quick Look

The Quick Look section (`/quick-look`, `/quick-look/[slug]`) is a spec-sheet
view of products that already exist in the catalog. It was ported in structure
from a sister project, rewritten for this store. These rules are standing.

1. **Alt text via helper.** Every image alt comes from `src/lib/imageAlt.ts`
   (`productImageAlt` for the hero, `productGalleryImageAlt` for gallery
   images). Never hardcode an alt string in a Quick Look component, and never
   invent a description of what a photo shows.
2. **Cross-linking rule (one field).** `POST_PRODUCT_LINKS` in
   `src/data/quick-look-links.ts` is the single source for the blog ↔ Quick Look
   relationship. Both directions read it: a post's product block from its own
   list, a Quick Look page's "From our blog" block from the reverse lookup.
   Limits: **max 5 products per post**, **max 2 posts per Quick Look page**.
   Only genuinely covered products — a passing name-drop does not count. Never
   mirror the mapping anywhere else.
3. **No hardcoded prices.** Amazon prices change constantly, so no price is
   written into copy, data or schema. Pages show the "Check current price on
   Amazon" call to action instead. A price may be displayed *only* when the data
   stores it together with a verified date (`priceCheckedOn`) and the UI shows
   "as of <date>" — see `datedPrice()` in `src/lib/site.ts`. Product JSON-LD
   omits `offers` entirely unless that dated, verified price exists.
4. **Affiliate disclosure and rel attributes.** Every outbound Amazon link uses
   `TrackedAffiliateLink` (or `rel="sponsored nofollow noopener"` plus
   `target="_blank"`) and the Amazon Associates disclosure sits next to the first
   buy button in plain visible text, and again in the guide section.
5. **No aggregateRating from Amazon data.** Amazon star ratings and review
   counts are Amazon's data, not ours. Never copy them into JSON-LD, schema or
   written text as our own rating, and never emit `review` markup for a product
   the site has not tested.
6. **Content written fresh per product.** Every guide is written from scratch
   for a US reader from the product's own listing data plus a named
   manufacturer/retailer source recorded in `specSource`. No shared template
   with the name swapped in, no text reused across products, no invented specs —
   unknown values stay out, estimates are labelled as estimates. Each page's
   FAQ array drives both the visible cards and the FAQPage JSON-LD.
7. **Guards must pass.** `npm run build` runs `scripts/check-quick-look.js`
   first: it fails the build on a broken cross-link slug, a breached link limit,
   a missing `specSource`/`displayName`/spec row, or any trace of another
   market's country, currency or brand. Quick Look URLs are registered in
   `src/lib/sitemap-routes.ts` (both `STATIC_PAGES` and
   `DYNAMIC_ROUTE_SOURCES`), so `assertSitemapCoverage()` fails the build if a
   new Quick Look page is not in the sitemap.

### Adding a Quick Look page

1. Add an entry to `QUICK_LOOK` in `src/data/quick-look.ts` (display name, spec
   groups with a real `specSource`, optional images/options).
2. Optionally add a guide to `QUICK_LOOK_GUIDES` in
   `src/data/quick-look-content.ts`. Pages without a guide render the spec sheet
   alone — no thin filler.
3. Link the post(s) that genuinely cover it via `POST_PRODUCT_LINKS`.
4. `npm run build` — the guard, the sitemap coverage check and the alt-text
   guard all run automatically.

If a build fails in `check-quick-look`, fix the data rather than the script.
