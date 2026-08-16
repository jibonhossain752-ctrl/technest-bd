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

## Technical notes

- NEVER use PowerShell `Get-Content`/`Set-Content` on UTF-8 source files
  (PS 5.1 reads/writes ANSI by default → mojibake). Use the edit/write tools,
  or Node `fs` with explicit `utf8`. PowerShell also chokes on `[brackets]`
  in paths.
- Build/verify: `npm.cmd run build`. Verify SEO output on the built HTML in
  `.next/server/app/` (see `C:\Users\User\AppData\Local\Temp\opencode\verify-seo.js`).
- Dark-blue `.page-header` hero banners are retired site-wide (old
  `src/components/ui/PageHeader.tsx` deleted). Page headers = light
  `Breadcrumb` bar + `.category-seo-head` H1 block.
- Commit + push to `main`; Vercel auto-deploys gadgeterea.com.
- Live site 308-redirects to `www.gadgeterea.com`; keep canonical/sitemap URLs
  on `gadgeterea.com` (non-www) per the SEO prompt unless told otherwise.
