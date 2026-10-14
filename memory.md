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
   carries no `offers` block at all: this store sells nothing on site, so the
   Product node never claims a price or an availability.
4. **Affiliate disclosure, and what never comes back.** Disclosure: one compact
   line beside the buy button plus the site-wide footer disclosure. No price
   notes, no listing-warranty text. The line is `SITE.amazonDisclosure` rendered
   with class `ql-disclosure` in `src/components/QuickLookDetail.tsx` — once on
   the page, never repeated in the guide. Two strings were deliberately deleted
   from this surface and stay deleted: the note under the buy button explaining
   that no price is shown (the button label already says where the price lives),
   and the line repeating the listing's warranty term (seller- and
   region-dependent, so not a fact). The catalog's own `warranty` field went with
   them. `scripts/check-quick-look.js` fails the build if any of that returns or
   if the disclosure renders twice. Every outbound Amazon link still uses
   `TrackedAffiliateLink` with the attributes from `AFFILIATE_LINK_ATTRS` in
   `src/lib/site.ts` — `rel="sponsored nofollow noopener"` and
   `target="_blank"`.
4b. **Detail layout comes from the source project, verbatim in structure.**
   `src/components/QuickLookDetail.tsx` + `QuickLookGallery.tsx` were ported
   from the sister project's Quick Look product page and keep its section order
   and rendering logic: highlight strip, gallery with a thumbnail rail and a
   "+N" see-all tile, variant chips, key-specifications and additional-info
   panels, the full grouped specification cards, notable limitations, the
   long-form guide, FAQ and "Keep exploring". The ONLY code-level change is the
   purchase area, which is now one outbound Amazon button. Do not re-add the
   cart/checkout/pre-order/notify buttons the source page had, and do not
   "improve" the ported sections. The Spec Score badge is a completeness
   indicator (share of filled spec fields) and must never be emitted as schema
   or described as a rating.
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
   **Depth standard:** aim for roughly 2,200–2,600 words of visible prose per
   guide (spec tables and link cards excluded) — daily use, the app, honest
   comparisons against named rivals, the manufacturer's own documented fixes,
   care and accessories, and 8–10 real buyer questions. Depth where buyers have
   questions, never padding. Comparison cells may only quote the compared
   manufacturer's own published figures, and a spec that cannot be verified from
   the manufacturer stays out of the table rather than being estimated.
7. **Guards must pass.** `npm run build` runs `scripts/check-quick-look.js`
   first: it fails the build on a broken cross-link slug, a breached link limit,
   a missing `specSource`, `displayName`, `metaDescription` or spec row, an
   empty spec group, a purchase panel missing its note, a rendered price figure,
   or any trace of another market's country, currency or brand. Every entry also
   needs at least 3 `highlights`, 5 `keySpecs` and 4 `additionalInfo` rows, and
   its `metaDescription` must be 120–160 characters with no wording about a
   price, a review or testing. Quick Look URLs are registered in
   `src/lib/sitemap-routes.ts` (both `STATIC_PAGES` and
   `DYNAMIC_ROUTE_SOURCES`), so `assertSitemapCoverage()` fails the build if a
   new Quick Look page is not in the sitemap.

### Adding a Quick Look page

1. Add an entry to `QUICK_LOOK` in `src/data/quick-look.ts`: display name, a
   hand-written `metaDescription` (120–160 characters), a real `specSource`, the
   spec groups, and the detail-page panels (`highlights`, `keySpecs`,
   `additionalInfo`), plus optional images and variant chips.
2. Optionally add a guide to `QUICK_LOOK_GUIDES` in
   `src/data/quick-look-content.ts`. Pages without a guide render the spec sheet
   alone — no thin filler.
3. Link the post(s) that genuinely cover it via `POST_PRODUCT_LINKS`.
4. `npm run build` — the guard, the sitemap coverage check and the alt-text
   guard all run automatically.

If a build fails in `check-quick-look`, fix the data rather than the script.
