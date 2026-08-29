# Agent Rules — GadgetErea (gadgeterea.com)

Standing instructions that apply AUTOMATICALLY to every future addition (blog
post, product, page, section, or anything else). Do not wait to be asked.

## 1. SEO — every new addition

1. Source real keywords the established way: for products, from the actual
   Amazon listing (title, bullet points, category); for blog posts, from the
   featured product's Amazon listing plus common buyer questions on the topic.
2. Fill ALL standard SEO fields: meta title (~60 chars, primary keyword near
   the start), meta description (~155–160 chars, primary keyword + reason to
   click), URL slug (short, keyword-based), H1, image alt text, natural
   in-body keyword placement (first 100 words, at least one H2/H3).
3. Blog posts: listicle-style title convention ("Best 5 X Under $Y (2026)"),
   Deal Card with real affiliate URL (NO price shown), 2–3 Related Posts
   links, Amazon Associate disclosure, FAQ section where relevant.
4. Products: Product schema markup (name, image, price, rating, availability).
   Only include guarantee/warranty info if the Amazon listing actually states
   one — NEVER invent one.
5. Add the new page/post/product to the XML sitemap automatically.
6. NEVER fabricate SEO content, keywords, specs, prices, or claims not
   grounded in the real source (Amazon listing / actual product data). If
   something can't be verified, say so instead of guessing.
7. Use `gadgeterea.com` for canonical URLs, sitemap URLs, and any hardcoded
   domain references — never `technest-bd.vercel.app` (unless explicitly told
   otherwise).
8. SEO correctness must NEVER come at the cost of visual quality. Implement
   SEO requirements (H1, meta, keywords, alt text, schema) with the site's
   existing design language — subtle, well-integrated elements only: a light
   breadcrumb bar (`Breadcrumb` component) + a plain, properly styled H1 block
   (`.category-seo-head` / `.blog-head` styles). Whenever a requirement can be
   satisfied multiple ways, choose the option that best preserves or enhances
   the page's design. NEVER introduce heavy or disruptive elements (dark
   banners, oversized headers) just to satisfy a checklist item. The old
   dark-blue `.page-header` hero banner (deleted `PageHeader.tsx`) is retired
   site-wide — do not reintroduce it.

## 2. Analytics — every new addition

1. New blog posts, products, and pages must automatically be covered by the
   per-page/per-product tracking system (page views, time on page, exit rate,
   etc.) — no per-item manual setup. The system is generic: page views key on
   the route path, product events key on `product_slug`, blog events key on
   `post_slug`/slug.
2. New products automatically included in product tracking (impressions,
   clicks, Buy Now clicks, add-to-cart) and all product rankings (Buy Now
   rank, category rank, discount/rating/price rank).
3. New blog posts automatically included in blog tracking (views,
   time-on-page, scroll depth, "Check Price on Amazon" clicks, FAQ clicks)
   and all blog rankings (click rank, time-on-page rank, blog-to-Amazon
   redirect rank, related-posts rank).
4. After adding a sample new item, VERIFY it shows up in the Admin Analytics
   dashboard without extra configuration. If it does NOT appear
   automatically, that is a bug in the tracking system — fix it so it
   generalizes. (Known behavior: client-side route changes fire `page_view`
   via `onRouteChange()` in `src/lib/tracking.ts`; aggregation is generic in
   `src/lib/analytics-aggregate.ts` keyed on meta slugs; admin queries join
   names only for display.)

## 3. Third-party script/API loading — standing rule (ALL future integrations)

1. Every third-party pixel/integration script (Meta Pixel, GA4, GTM, TikTok
   Pixel, Pinterest Tag, or any other vendor script added later) MUST load in a
   non-blocking, parallel fashion: use Next.js `<Script strategy="afterInteractive">`
   (or equivalent async, inject-only-at-runtime pattern). NEVER use a plain
   synchronous `<script>` in `<head>`/HTML body that can delay first render.
2. NEVER fully delay a tracking script until "everything else finished" — it
   must start loading in parallel with the page so early exits still get
   tracked (current Meta Pixel pattern in `src/app/layout.tsx`: inline fbq
   bootstrap via `afterInteractive` + `src/lib/meta-pixel.ts` lazy async
   fallback that queues events until the SDK is ready — keep this pattern).
3. Server-side API integrations (e.g., Google Search Console via `googleapis`
   in `src/lib/search-console.ts`) may only be called from API routes /
   cron jobs — never from the storefront page render path, so they can never
   add to page TTFB.
4. JSON-LD `<script type="application/ld+json">` is data, not JavaScript —
   it renders in-server and is exempt from these rules.
5. After adding/editing any third-party integration, verify: script appears in
   the initial HTML only as non-blocking/injected-at-runtime (check built
   HTML in `.next/server/app/`), the vendor beacon fires (network trace, e.g.
   `facebook.com/tr/?...ev=PageView&...`), and Lighthouse performance score is
   not worse than before the change.

## 4. General

Run this checklist quietly on every addition: SEO fields filled from real
source data → sitemap updated → domain references `gadgeterea.com` → analytics
tracking active and verified.

## 5. Blog post ordering — newest first (standing rule)

Every newly published blog post must automatically appear first/at the top —
sorted above all existing posts — in BOTH of these locations:

1. The Blog listing page (`/blog` — `src/app/blog/page.tsx`) — the new post
   must be the first card in the main grid.
2. The Home page's "Latest Blog Posts" (or equivalent) grid — currently
   `src/components/LatestBlogPosts.tsx` (rendered in `src/app/page.tsx`) — the
   new post must be the first card there too.

This must happen naturally via publish-date-based sorting (newest first), not
require manual reordering of the `POSTS` array each time. The current
implementation sorts by `date` descending inside `useMemo` (blog page) and
inline in the component (Latest Blog Posts). If a future refactor accidentally
restores source-order rendering, the new-post-first behavior will silently
break — verify with a live screenshot of both pages after every new post.

When publishing any future post:

- Confirm the post's `date` is set to a real publish date (not future, not
  past relative to the actual publish moment).
- After the post is added, build + visit `/blog` and `/` and screenshot both
  pages to confirm the new post is genuinely the first card in each grid —
  do not assume the sort logic handles it.

## Technical notes

- NEVER use PowerShell `Get-Content`/`Set-Content` on UTF-8 source files
  (PS 5.1 reads/writes ANSI by default → mojibake). Use the edit/write tools,
  or Node `fs` with explicit `utf8`. PowerShell also chokes on `[brackets]`
  in paths.
- Build/verify: `npm.cmd run build`. Verify SEO output on the built HTML in
  `.next/server/app/` (see `C:\Users\User\AppData\Local\Temp\opencode\verify-seo.js`).
- After adding new product/blog/video images, regenerate responsive variants +
  the variant map: `node scripts/gen-image-variants.js` (creates `-260w/-360w/-520w/-720w.webp`
  and `-480w.webp` files + rebuilds `src/data/imageVariants.ts`; used by
  `src/lib/images.ts` `responsiveSrcset()` in hero/product/blog cards).
- Dark-blue `.page-header` hero banners are retired site-wide (old
  `src/components/ui/PageHeader.tsx` deleted). Page headers = light
  `Breadcrumb` bar + `.category-seo-head` H1 block.
- Commit + push to `main`; Vercel auto-deploys gadgeterea.com.
- Live site 308-redirects to `www.gadgeterea.com`; keep canonical/sitemap URLs
  on `gadgeterea.com` (non-www) per the SEO prompt unless told otherwise.

## Project Context (full recap — permanent, do not ask again)

**Site:** GadgetErea (formerly "TechNest BD/US" during early dev — renamed)
**Domain:** `gadgeterea.com` — custom domain, DNS via ExonHost, A + CNAME to Vercel
**Stack:** Next.js, deployed on Vercel, GitHub CI/CD
**Model:** Amazon affiliate — no on-site payment/checkout. Every "purchase" is an
outbound click to Amazon via affiliate links. No `Purchase` event/order data can
ever be confirmed — this shapes tracking, Pixel setup, and checkout design.
**Audience:** US-based
**Local paths:**
- Project: `C:\Users\User\Documents\opencode test`
- Dedicated agent memory: `C:\Users\User\Documents\local agent\agent-memory.md`
  (read at start of every session, updated at end)

**Pages:** Home, Blog (listing + individual posts), Shop (+ category filters +
New Arrivals, max 12 items), Deals (+ category sidebar, same style as Shop),
Flash Sale, About, Contact, Cart, Checkout, FAQ. Header: logo (click → Home +
full page reload, not SPA nav), nav links, search bar, cart icon, hamburger menu
(Community links: WhatsApp/Facebook, Newsletter Quick Subscribe, 5 social icons:
Facebook/Instagram/WhatsApp/YouTube/Pinterest).

**Products:** 29 real Amazon affiliate products, sourced from real Amazon
listings (name, image, price, rating, description) — **never fabricated**.
Products with unconfirmed price show "Price unavailable" (price field is
nullable), never a guessed number.
**Categories:** Laptops & PCs, Smartphones, Audio & Wearables, Gaming Gear,
Accessories, Networking, Cameras, Smart Home.
**Deals page** = curated subset of best-value products (by discount/rating).
**Flash Sale** = further subset of those, chosen by likely buyer interest.
**New products** (e.g. Jack & Rose K1 Steamer) get added the same way: real
Amazon data only, assigned to the most relevant category, added to Shop (and New
Arrivals if new), checked for Deals/Flash Sale eligibility based on real
discount/rating data — never forced in without justification.
**Blog-only "trending product" posts** (EGOR egg robot, Beni camera robot,
iPhone 18/Ultra) are **not** Amazon products — crowdfunding/pre-release news
content with no Deal Card, no Amazon link, just an external link to the source
(or no link at all for pure news pieces) and no Amazon Associate disclosure.

**Checkout flow (non-standard):** No traditional checkout/payment. Checkout shows
numbered steps explaining the flow, a "Your Items" panel with each product and
its own "Buy on Amazon" button, price/quantity info, trust badges ("Secure
checkout on Amazon", "100% genuine", "Easy returns via Amazon"), and the
Associate disclosure. No "Buy All" button (removed per instruction — only
individual per-item buttons remain). On desktop, if the cart has more items
than fit, use a "See All Products" popup with internal scroll rather than
page-level scroll.

**Blog:**
- Categories: All, Reviews/Roundup, Buying Guides, Tips & Tricks, Explainer
  (reconcile "Roundup" vs "Reviews" tag naming if still inconsistent).
- Structure template: category tag, title, subtitle, meta row (author/date/read
  time), hero image, body content, Deal Card (product image + name + "Check
  Price on Amazon" button — **no price shown on this card**, only for
  Amazon-affiliated posts), Associate disclosure (Amazon posts only), Related
  Posts, social share icons, FAQ section.
- **Keyword strategy:** for trending/newsjacking posts (crowdfunding products,
  unreleased tech), deliberately target lower-competition long-tail or
  brand-specific keywords instead of generic high-competition terms — verified
  via SEMrush Volume/KD data before writing. Established evergreen Amazon
  products use standard product-page SEO instead.
- **Image rule (current, going forward):** hero images ~1200px width, 3:2 or
  16:9 ratio (not full-viewport height) — applies only to posts published from
  now on; older posts are NOT retroactively resized. All images: WebP format,
  descriptive keyword-based filenames, compressed, self-hosted in the project's
  own storage (never hotlinked, never left referencing a local
  Desktop/Downloads path — always moved into the repo and committed to GitHub),
  proper `object-fit`/`object-position`, verified visually in the browser
  before considering the task done — this has broken multiple times before,
  always re-check.

**SEO (already implemented, maintain going forward):**
- Full on-page SEO per page/post: meta title, meta description, URL slug, H1
  with primary keyword near start, keyword in first 100 words, at least one H2
  with keyword, image alt text, Product/Article schema, canonical tags.
- XML sitemap live and submitted to Google Search Console (verified property:
  `gadgeterea.com`). Image sitemap tags included for Google Image Search
  discoverability.
- robots.txt disallows `/cart`, `/checkout`, `/account`, `/login`,
  `/register`, `/admin`, `/api`.
- Google Search Console API integrated into Admin Analytics (service account
  credentials stored as env vars, not committed — JSON key was at
  `C:\Users\User\Desktop\website\angelic-triumph-501313-t0-d8d32c9823dd.json`,
  extracted into env vars).
- **Standing rule: never sacrifice visual design for an SEO requirement** (e.g.
  don't reintroduce a heavy/ugly banner just to add an H1 — find a
  design-consistent way).
- **Standing rule: SEO always applied last**, after functional/content work is
  complete for whatever is being built, but must always be done — never skipped.

**Analytics system (custom, Supabase-backed):**
- Tables: `analytics_events`, `analytics_sessions`, `analytics_daily`,
  `analytics_pages_daily`, `analytics_reports`. Tracking fires async, 2-3s
  after page load, deduped, non-blocking.
- Massive tracking coverage already implemented: page/traffic, product events
  (impression/click/ViewContent-equivalent/AddToCart/Buy Now as primary
  conversion), blog events, newsletter/community events, video widget events
  (5 platforms, ranked), navigation/UI events, affiliate-adjusted funnel (ends
  at outbound click, never a fake Purchase), content/SEO signals,
  marketing/campaign tracking, technical health monitoring, real-time active
  users, and per-page individual tracking for every page/post/product
  separately.
- Extensive ranking/leaderboard system: product click rank, Buy Now rank, Add
  to Cart rank (per Shop/Deals/Flash Sale), category rank,
  discount/rating/price-range rank, blog click rank, time-on-page rank,
  blog-to-Amazon redirect rank, author rank, related-posts rank, social-share
  rank, FAQ rank (site + Google search), search rank (product/blog),
  search-to-click rank, video rank, exit-page rank, popup dismiss-vs-subscribe
  rank, device conversion rank.
- Admin dashboard at `/admin/analytics` (auth-only, never loads on public
  pages). Dashboard reads only from aggregated tables, never raw events, to
  stay fast (this was a real fixed bug — dashboard was taking up to 10s before
  the fix).
- **Standing rule: any new blog post or product must automatically be picked
  up by this tracking/ranking system with zero manual per-item setup** — this
  was verified working (a real SPA-navigation `page_view` bug was found and
  fixed to make this true).

**Meta Pixel:**
- Pixel ID: `2109685666607933`. Base code in root layout via `next/script`,
  async.
- Implemented events: PageView (auto), ViewContent, Search, AddToCart,
  InitiateCheckout (= the real conversion, since Purchase can't be confirmed
  off-site), Lead (newsletter), Contact. Explicitly **not** implemented:
  Purchase, AddPaymentInfo, CustomizeProduct, Donate, Schedule, StartTrial,
  Subscribe, FindLocation (not applicable to this affiliate/no-payment model),
  AddToWishlist/CompleteRegistration (only if those features actually exist —
  verify before adding). Custom events: VideoWidgetClick,
  SocialShareClick, BlogCategoryFilterClick.
- Advanced Matching set up on the Lead event (hashed email) for better Event
  Match Quality.
- All event parameters use real product data — never fabricated values.

**Known recurring issues to watch for:**
- Blog image cropping/positioning has broken and been "fixed" multiple times
  without real verification — always visually check every image individually in
  the browser, not just a sample.
- Reported task completion has been inaccurate before (e.g. "30 blog posts
  done" when only 9 existed) — always independently verify counts/status
  rather than trusting a self-report.
- SEO work has previously caused unintended visual side effects (reintroduced
  a removed hero banner, added new headings) — always report and confirm before
  making visually significant changes as a side effect of an SEO task.

**Do not re-ask** any of the above. This context is permanent.
