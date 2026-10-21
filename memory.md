# GadgetErea — memory

Standing rules and decisions for this repository. Read before adding pages,
products, posts or sections.

## Quick Look

The Quick Look section (`/quick-look`, `/quick-look/[slug]`) is a spec-sheet
view of products that already exist in the catalog. It was ported in structure
from a sister project, rewritten for this store. These rules are standing.

1. **Alt text via helper.** Every image alt comes from `src/lib/imageAlt.ts`
   (`productImageAlt` for the hero, `quickLookGalleryAlts` for the gallery list,
   which falls back to `productGalleryImageAlt` per position). Hand-written alt
   in the data layer wins: an entry's `imageAlts` array is position-matched to
   its gallery and is passed through untouched, the same way a post's `altText`
   does. Never hardcode an alt string in a Quick Look component, and never
   invent a description of what a photo shows. The guard fails the build when
   `imageAlts` is not the same length as the gallery the page renders.
2. **Cross-linking rule (one field).** `POST_PRODUCT_LINKS` in
   `src/data/quick-look-links.ts` is the single source for the blog ↔ Quick Look
   relationship. Both directions read it: a post's product block from its own
   list, a Quick Look page's "From our blog" block from the reverse lookup.
   Limits: **max 5 products per post**, **max 2 posts per Quick Look page**.
   Only genuinely covered products — a passing name-drop does not count. Never
   mirror the mapping anywhere else.
3. **Price box — one manual manufacturer price, never an Amazon one.** Every
   Quick Look page renders a "Price" box. A figure appears in it only through
   `priceBox` on the entry: a manually entered figure from the manufacturer or
   its own store, carrying `label`, `amount`, `source` and an ISO `asOf` date,
   rendered as   "as of <date>". A page may carry a `priceBox` and an Amazon buy link
   together: price + buy link allowed together by owner decision on 2026-10-21,
   and the prices are hand-entered and may be out of date. (This replaced the
   2026-10-20 rule that the two could never coexist.) A page priced per variant
   leaves `amount` out and puts one row per variant in `rows`; its `label` is
   then the neutral heading. A page with no `priceBox` shows one muted
   line, "No price listed" (`NO_PRICE_LABEL` in
   `src/components/QuickLookDetail.tsx`). Catalog prices stay out of Quick Look
   copy, data and schema: they carry no verified date, so the UI shows the call
   to action instead — see `datedPrice()` in `src/lib/site.ts`. A Quick Look page
   carries no Product JSON-LD at all: this store sells nothing on site, so there
   is no offer, price or availability to claim, and Google rejects a Product node
   without `offers`, `review` or `aggregateRating` (see rule 4d).
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
4c. **No breadcrumb on the detail pages.** No visible breadcrumb and no
   BreadcrumbList on Quick Look detail pages; navigation is via Keep exploring
   links. Both halves were deleted: the ported `.ql-crumbs`   row ("Quick Look / <Category>") in `src/components/QuickLookDetail.tsx` and
   the detail page's `Breadcrumb` render. The row's three selectors in
   `src/app/globals.css` went with it — nothing else ever used them — and the
   space the row occupied moved into `.ql-detail`'s top padding, so the title
   block keeps its distance from the header. Two things deliberately stay:
   the listing page `/quick-look` keeps its own `Breadcrumb` (JSON-LD only, it
   has never rendered a row) and the detail page keeps its FAQPage JSON-LD.
   `scripts/check-quick-look.js` fails the build if either half comes back.
4d. **No Product JSON-LD on the detail pages (2026-10-17).** Search Console
   reported a critical Product-snippet error on every Quick Look page —
   `Either "offers", "review", or "aggregateRating" should be specified` —
   because the Product node carried only name, description, brand, category,
   url, additionalProperty and image. There is nothing true to add: no price is
   shown, nothing is sold on site, and rule 5 forbids publishing Amazon's rating
   or a review of an untested product. The node was therefore deleted from
   `src/app/quick-look/[slug]/page.tsx` and `quickLookProductSchema` was removed
   from `src/lib/quick-look-schema.ts`. `BreadcrumbList` (never present here)
   and `FAQPage` are untouched. Do not re-add a Product node to this surface
   without a real, visible offer, review or rating to put in it.
4e. **Informational entries — the one page with no purchase path (2026-10-17).**
   `informational: true` marks a spec sheet for a product this store does not
   sell and cannot link to a store for (first use: Apple HomeView). Such an
   entry is STANDALONE, carries no `buyUrl`, is never added to
   `src/data/products.ts` (no shop card, no /product page), and its page renders
   NO purchase panel: no store button, no price note, no affiliate disclosure.
   The site-wide footer line still appears, as it does on every page. In the
   panel's place the detail page renders a plain visible note saying the store
   does not sell it — text only, never a link — and, because the gallery shows
   renders rather than the manufacturer's photographs, one line under the
   gallery saying so. `scripts/check-quick-look.js` fails the build when such an
   entry carries a buy link, when an informational entry is a catalog product,
   or when `QuickLookDetail.tsx` stops branching on the flag. The guide's price
   rule exception is described at the top of `src/data/quick-look-content.ts`.
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
   a breadcrumb or `BreadcrumbList` on a detail page, or any trace of another
   market's country, currency or brand. Every entry also needs at least 3
   `highlights`, 5 `keySpecs` and 4 `additionalInfo` rows, and
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
