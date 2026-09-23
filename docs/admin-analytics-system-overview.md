# Custom Analytics System — Complete Technical Overview

> **Purpose of this document.** This is a full, self-contained description of a custom-built,
> Supabase-backed analytics system (event tracking → aggregation → admin dashboard → third-party
> integrations) as actually implemented in a production Next.js site. It was written to be handed
> to a different agent building a **new website from scratch**, so it is written generically:
> anything specific to the original site's business model (an Amazon-affiliate storefront called
> "GadgetErea") is marked with **[SITE-SPECIFIC]** notes and a "how to adapt this" explanation.
> Everything else — the schema, pipeline, aggregation strategy, dashboard structure, and
> integration patterns — is directly reusable for any website.
>
> **Everything below reflects the actual current code**, not the original plan. Where a feature
> was planned but never implemented, that is stated explicitly.

---

## 1. Architecture overview

### 1.1 The tracking pipeline

```
User action in browser
        │
        ▼
track(event, page, meta)            src/lib/tracking.ts  (client, tiny, vanilla TS)
  • 2-second per-key dedupe window
  • payload = event, page, session_id, source, device/os/browser, url, ref_host, utm, meta
        │
        ▼  POST /api/analytics/track   (fetch, keepalive, fire-and-forget)
        │
API route (server)                  src/app/api/analytics/track/route.ts
  • validates/truncates input
  • enriches with server-known geo: x-vercel-ip-country / x-vercel-ip-city headers
        │
        ▼
recordEvent()                       src/lib/analytics-server.ts
  • INSERT one row into analytics_events   (raw, append-only)
  • INSERT or UPDATE the matching row in analytics_sessions
        │
        ▼
Daily aggregation (cron or on-demand backfill)     src/lib/analytics-aggregate.ts
  • reads raw events + sessions for one UTC day
  • computes ALL breakdowns (products, sources, devices, locations, search…)
  • delete + recompute → writes 3 aggregate tables:
      analytics_daily / analytics_pages_daily / analytics_reports
        │
        ▼
Admin dashboard pages               src/app/admin/analytics/*
  • read ONLY aggregate tables (never raw events, except realtime monitor)
  • JSON snapshot per day makes page loads fast regardless of raw volume
```

### 1.2 Why this architecture

- **Zero impact on public-page performance.** The tracker is one small vanilla-TS module
  (~10 KB uncompressed). The first `page_view` fires 2.5 s after load; everything is async,
  fire-and-forget, with `keepalive` fetches. No analytics dashboard code, chart library, or
  query logic ever loads on public pages. A large funnel/ranking library living on public
  pages was an explicit non-goal.
- **Heavy dashboard, light storefront.** All expensive work (SQL aggregation, ranking, joins
  to content names) happens in two places: the daily cron, and admin-only dashboard renders
  that hit pre-computed tables. Public visitors never pay for admin features.
- **Aggregates, not raw queries.** The raw `analytics_events` table grows forever and gets
  slow. The dashboard instead reads one JSON "report payload" per day — a single row per day
  contains every breakdown the dashboards need. Page renders stay fast even with millions of
  raw events. (The original build queried raw tables and took **up to 10 s** per dashboard
  page; the aggregate-table rewrite fixed this — see §8.)
- **Session model without cookies/consent-banner complexity.** Sessions are anonymous IDs in
  `localStorage` with a 30-minute TTL. This was a deliberate choice for a content site where
  cross-device identity is not needed. **[ADAPT]** If your site needs durable user identity,
  add a `user_id` column (it already exists in the schema, currently always `null`).
- **Self-monitoring.** The tracker counts its own failed sends in `localStorage` and reports
  them as a `tracking_fail` event once the pipeline recovers — you can see outages in your
  own analytics.

### 1.3 Tech requirements to replicate

- Next.js App Router (any version) + Postgres (Supabase used here for hosted Postgres + a
  simple REST client; **plain SQL/Prisma works identically — nothing is Supabase-specific
  except the client library**).
- A daily cron (Vercel Cron via `vercel.json`: `0 3 * * *` → `/api/analytics/cron`).
- Env vars: `CRON_SECRET`, `ADMIN_COOKIE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
  `REPORT_EMAIL`, optional `SMTP_*`, plus Search Console vars (§7).

---

## 2. Database schema

Source of truth: `supabase/schema.sql` (analytics section) and `supabase/search_console.sql`.
All tables live in the `public` schema, RLS enabled with a `service_role`-only policy
(dashboards and the tracker API use the server-side service-role key; **no analytics table is
ever readable or writable by the anon client key**).

### 2.1 `analytics_events` — raw, append-only (dashboards never read this for display)

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `session_id` | text NOT NULL | anonymous client-generated UUID |
| `user_id` | text nullable | reserved for logged-in identity; currently always null |
| `event` | text NOT NULL | event name, e.g. `page_view` |
| `page` | text, default `''` | path, e.g. `/blog/some-post` |
| `source` | text, default `'direct'` | `direct / google / facebook / instagram / youtube / tiktok / pinterest / whatsapp / referral / <utm_source>` |
| `device` | text, default `'unknown'` | `desktop / mobile / tablet` |
| `os`, `browser` | text nullable | from UA sniffing client-side |
| `country`, `city` | text, default `'unknown'` | filled server-side from Vercel geo headers |
| `url` | text, default `''` | full URL, truncated to 500 chars |
| `ref_host` | text nullable | referrer hostname |
| `utm_campaign`, `utm_medium`, `utm_source` | text nullable | |
| `meta` | jsonb, default `{}` | per-event payload (slugs, query strings, seconds, CWV…) |
| `created_at` | timestamptz, default `now()` | |

Indexes: `created_at DESC`, `session_id`, `event`, `page`, and composite `(created_at, id)`
for the aggregation window scans.

**Generic:** everything except how `meta` slugs are interpreted (below).

### 2.2 `analytics_sessions` — one row per visit (upserted by the tracker API)

| Column | Type | Notes |
|---|---|---|
| `session_id` | text PK | same ID the events carry |
| `user_id` | text nullable | |
| `source`, `device`, `country`, `city` | text | first-seen values |
| `landing_page`, `exit_page` | text | updated as the session progresses |
| `started_at`, `last_activity` | timestamptz | `last_activity` powers "online now" |
| `ended_at` | timestamptz nullable | present but never set by current code (planned, not implemented) |
| `page_views` | int, default 1 | |
| `interactions` | int, default 0 | any non-pageview event increments |
| `duration_seconds` | int, default 0 | last `time_on_page`/`page_exit` value |

Index: `last_activity DESC` (realtime "online now" count = sessions active in last 5 min).

### 2.3 `analytics_daily` — daily totals keyed by (source, device, country)

PK `(date, source, device, country)`. Columns: `visitors`, `unique_visitors`, `sessions`,
`page_views`, `bounces`, `session_seconds`, plus conversion counters:
`affiliate_clicks`, `add_to_cart`, `checkouts`, `newsletter_subscribes`, `newsletter_shown`.

- **Generic:** `visitors … session_seconds`, `date/source/device/country` keying.
- **[SITE-SPECIFIC]** the counter columns are the original site's funnel vocabulary:
  `affiliate_clicks` (outbound "buy" click = the conversion event), `add_to_cart`,
  `checkouts` (checkout-page views — the site has no real checkout), `newsletter_*`.
  **Adapt by renaming these to your own funnel stages** (e.g. `signups`, `form_leads`,
  `demo_clicks`). The aggregation code maps event names → these columns in one function
  (`metricFor()` in `src/lib/analytics-aggregate.ts`) — change the mapping, not the table.

### 2.4 `analytics_pages_daily` — daily per-page stats

PK `(date, page)`. Columns: `views`, `unique_views` (distinct sessions),
`time_on_page_seconds`, `exits`, `referral_hits`. Fully generic.

### 2.5 `analytics_reports` — the workhorse: one JSON snapshot per day

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `date` | date | one row per UTC day |
| `payload` | jsonb | the full summary payload (below) |
| `created_at` | timestamptz | |

`payload` (version field `version: 3` — bumped whenever the computation changes, so stale
rows are ignored and recomputed):

- Totals: `page_views, visitors, unique_visitors, sessions, affiliate_clicks, add_to_cart,
  checkouts, newsletter_subscribes, newsletter_shown, session_seconds, bounce_rate`
- `top_pages` (top 10)
- `by_source` (views per source)
- `sources[]` — per-source sessions/views/bounces/time + conversion counters
- `products[]` — per-product-slug `views / add / clicks` (top 300) **[SITE-SPECIFIC]**
- `categories[]` — per-category `views / clicks` **[SITE-SPECIFIC]**
- `blogPosts[]` — per-post-slug `views / cardClicks / deepReads / timeSeconds / timeCount`
  (top 300) **[SITE-SPECIFIC]** (deep reads = scroll to 100%)
- `search` — per-term `searches / noResults / clickThroughs` for site search, plus
  search-to-click ranks for products and posts **[SITE-SPECIFIC vocab, generic concept]**
- `faq[]` — per-question expand counts **[SITE-SPECIFIC]**
- `newsletter[]` — impressions/subscribes bucketed by visitor country
- `sePages[]` — per-page search-engine (google/bing/duckduckgo) views + distinct sessions
- `devices` — `{ devices[], os[], browsers[] }` each with sessions/views/conversions
- `locations[]` — per-country sessions/views/conversions + top cities

**Key design point:** *everything the dashboards display lives in this one JSON per day*.
Dashboard queries = "read N rows from `analytics_reports`, merge in memory". No GROUP BY
over raw events, ever.

### 2.6 `search_console_cache` — Google Search Console snapshot

Single row (`id = 'snapshot'`): `site_url, fetched_at, totals jsonb, trend jsonb,
queries jsonb, pages jsonb, sitemaps jsonb, inspections jsonb, last_error jsonb`.
See §7. Fully generic.

### 2.7 Tables that exist in the DB but are *not* part of the analytics system

`users`, `orders`, `subscriptions`, `contact_messages`, `newsletter_subscribers` —
application tables (accounts, orders, contact form, newsletter). The newsletter analytics
counts come from events, not these tables. `analytics_reports` is the only analytics table
the dashboard's "scheduled reports" section reads directly.

---

## 3. Tracking implementation

### 3.1 The client tracker (`src/lib/tracking.ts`) — plain TS, no dependencies

- **Session id:** `localStorage['tn_analytics_session'] = '<uuid>|<timestamp>'`, 30-min TTL;
  falls back to a random id if storage is blocked. New session fires `session_start`.
- **Dedupe:** identical `event|page|dedupKey` calls within 2 s are dropped
  (`meta._dedupKey` lets callers opt into e.g. per-image dedupe); the `lastSent` map resets
  past 300 keys to avoid unbounded growth. `track(..., { force: true })` bypasses dedupe.
- **Enrichment client-side:** source detection from `document.referrer` (social hosts →
  named sources; else `referral`; else `direct`), overridden by `utm_source`/`gclid`/`fbclid`
  URL params. Device/OS/browser from a small UA parser (with real fixes: iPadOS 13+ desktop
  UA detected via `maxTouchPoints`; iOS checked before "Mac OS X" because iPhone UAs contain
  "like Mac OS X").
- **Sending:** `fetch('/api/analytics/track', { keepalive })` — one request per event,
  no batching (batching was considered but single-event keepalive sends survive page
  unload, which matters more for `time_on_page`). Failed sends go to a `localStorage`
  queue (max 50) and are flushed on next successful send or next page load.
- **Auto-instrumentation in `initAnalytics()`** (mounted by a client component in the root
  layout, `src/components/AnalyticsBootstrap.tsx`):
  - `page_view` 2.5 s after load (async, never blocks TTI)
  - **SPA route-change page views** via `onRouteChange(pathname)` wired to
    `usePathname()` — this was a real bug fix (§8) and is the piece that makes tracking
    work on every page including future ones with zero per-page setup
  - scroll depth at 25/50/75/100% (rAF-throttled; per-page once each)
  - `time_on_page` on `visibilitychange→hidden` and `pagehide` (dedupe prevents
    double-send); on SPA navigation the *previous* page's time is flushed first
  - Core Web Vitals via PerformanceObserver: `page_load` event with `lcp_ms, cls, fcp_ms,
    inp_ms, nav_ms` (sent once, forced past dedupe)
  - `js_error` (window error + unhandledrejection, capped 300 chars)
  - `image_error` (capture-phase `<img>` error listener, deduped per src)
  - `tracking_fail` self-report when queued failures are detected at init

### 3.2 The server side

- `POST /api/analytics/track` (`src/app/api/analytics/track/route.ts`): validates + truncates
  every field (event ≤ 60, page ≤ 200, session ≤ 100, meta JSON ≤ 2000 bytes — oversized meta
  replaced with `{_truncated: true, key}`), reads **server-side geo** from
  `x-vercel-ip-country` / `x-vercel-ip-city` headers (client-reported country is *not*
  trusted for country/city), then `recordEvent()`.
- `recordEvent()` (`src/lib/analytics-server.ts`): inserts the raw event, then keeps the
  session row in sync:
  - `page_view`/`session_start` → insert session (landing page) or update
    (`exit_page`, `page_views+1`, `last_activity`)
  - `time_on_page`/`page_exit` → update `duration_seconds`
  - any other event → `interactions+1`
  Note: this does a read-then-write on the session per event — fine at this site's volume;
  **[ADAPT]** at high volume, convert to a Postgres `INSERT ... ON CONFLICT` upsert.

### 3.3 The real, current event list (from the code, not the plan)

**Generic — reusable on any site as-is:**

| Event | Fired by | Notes |
|---|---|---|
| `session_start` | tracker init | new localStorage session |
| `page_view` | timer + SPA route change | |
| `scroll_depth` | auto | meta `{ percent: 25/50/75/100 }` |
| `time_on_page` | auto | meta `{ seconds }` |
| `page_load` | auto | Core Web Vitals meta |
| `js_error`, `image_error`, `tracking_fail` | auto | technical health |
| `page_exit` | defined server-side (updates session) | no client sender currently fires it — the `time_on_page` send covers the same need; treat as semi-implemented |
| `header_search`, `shop_search`, `blog_search` | search inputs | meta `{ query, results }` (results count enables no-result ranking) — rename for your sections |
| `faq_expand`, `faq_category_select` | FAQ accordion | content-signal events, generic concept |
| `contact_submit` | contact form | generic lead event |
| `register_success` | account registration | generic |
| `newsletter_subscribe`, `newsletter_shown` (+ popup/widget placement variants: `newsletter_popup_shown/dismissed/no_interaction/subscribe_click`, `newsletter_quick/section/widget_subscribe_click`) | newsletter UI | generic conversion-funnel pair (shown vs subscribed) |
| `nav_menu_click`, `nav_menu_close`, `nav_hamburger_click`, `nav_logo_click`, `nav_account_click`, `bottom_nav_click` | navigation UI | UI-engagement events |
| `social_link_click`, `share_click` (meta `{ platform, post_slug }`) | social icons / share buttons | |
| `video_card_impression`, `video_card_click`, `video_scroll` | embedded video widget | |
| `community_link_click` (meta `{ platform }`) | WhatsApp/Facebook community buttons | |

**[SITE-SPECIFIC] — commerce/affiliate funnel (adapt names to your conversion model):**

| Event | Meaning | Adapt note |
|---|---|---|
| `product_view`, `product_impression`, `product_card_click` | catalog engagement | generic e-commerce; keep for any product/offer page |
| `category_select` | category filter click | |
| `add_to_cart`, `remove_from_cart`, `clear_cart`, `cart_view`, `checkout_view` | cart funnel | the site has no real cart persistence — these measure intent only |
| `begin_checkout` | cart page → checkout (meta `{ item_count, product_slugs }`) | |
| `affiliate_click`, `buy_now`, `deal_price_click` | **outbound affiliate click = the site's real conversion**. All three count identically as `affiliate_clicks` in aggregation (`CLICK_EVENTS` set in `analytics-server.ts`) | **Replace with your conversion event(s)**: signup, form submit, demo request… the "conversion = CLICK_EVENTS set + one `metricFor()` mapping" pattern stays identical |
| `buy_on_amazon`, `buy_all_amazon` | defined in server `CLICK_EVENTS` | no client call sites currently fire `buy_all_amazon` (the "Buy All" button was removed) — dead but harmless; don't copy dead events |
| `blog_card_click`, `blog_popular_post_click`, `blog_tab_click`, `blog_load_more`, `blog_tabs_scroll` | blog listing engagement | content-site generic |
| `shop_sort`, `shop_filters_toggle`, `shop_pagination`, `flash_sale_cta_click`, `checkout_see_all_click` | shop UI | |

**Planned in early docs but NOT implemented (do not assume they exist):** exit-page
rank based on a dedicated `page_exit` client event, "author rank", per-Shop/Deals/Flash-Sale
add-to-cart splits, discount/rating/price-range product ranks. Some of these names survive
in `AGENTS.md` prose; the code does not compute them.

---

## 4. Ranking / leaderboard system

All ranking queries live in `src/lib/analytics-queries.ts` and share one shape:

1. Load the last N daily report payloads (`analytics_reports`, version-filtered) —
   **the only DB touch**.
2. Merge the per-day arrays in memory (Map keyed by slug/term/source…).
3. Join display names/images by looking up the site's own content arrays in code
   (products/posts are hardcoded typed data on this site — **[ADAPT]**: on a CMS-backed
   site, fetch or pass a slug→title map instead; the merge logic is unchanged).
4. Sort + `slice(0, 20)`.

Implemented rankings (function → logic):

| Ranking | Logic summary |
|---|---|
| **Top Products** (`getTopProducts`) | sum per-slug `views/add/clicks` across days; `conversions = add + clicks`; sort by views |
| **Top Categories** (`getTopCategories`) | per-category views/clicks, sort by views |
| **Top Blog Posts** (`getTopBlogPosts`) | views, card clicks, deep reads (scroll 100%), avg time; **engagement score = ½·(deepRead/views·100) + ½·min(avgTime/120s,1)·100** |
| **Source Rankings** (`getSourceRankings`) | per-source sessions, views/session, avg time, bounce %; a **performance score**: engagement flag (views/session ≥ 2 AND avg time ≥ 60s AND bounce ≤ 50%) → 60 pts + min(convRate·2, 40) pts; sorted by score |
| **Purchase Funnel** (`getFunnel`) | Sessions → Page Views → Add to Cart → Buy/Affiliate → Newsletter, as % of sessions **[SITE-SPECIFIC labels]** |
| **Daily Trend** (`getDailyTrend`) | from `analytics_daily` (not reports) summed across source/device/country per date |
| **Top Pages** (`getTopPages`) | page → views from report `top_pages` merged |
| **Search rankings** (`getSearchRankings`) | per-term searches / no-results / click-throughs; **click-through = a click on a result within 60 s after the search** (computed at aggregation time by a per-session event-lookahead, see below) |
| **Search-to-click rank** (`getSearchClickRank`) | which product/post got the clicks after searches |
| **FAQ rankings** (`getFaqExpandRanking`, `getFaqGoogleTraffic`) | expand counts per question+location; Google-attributed traffic per `/faq` page |
| **Device analytics** (`getDeviceAnalytics`) | sessions/views/conversions per device, OS, browser; **conversion = session contained any add-to-cart or click event** (session-id set built during aggregation) |
| **Location analytics** (`getLocationAnalytics`) | same per country + top 5 cities |
| **Newsletter stats** (`getNewsletterStats`) | subscribes ÷ impressions overall and per placement/country |
| **Search-engine traffic per page** (`getSearchEngineTraffic`) | from report `sePages` (referrer-based google/bing/ddg) |

The **search click-through lookahead** (inside `aggregateDay()`) is worth copying: for each
session it orders search + click events by time; after a search, any
`product_view`/`blog_card_click`/`/blog/...` page_view within the next 60 s (and before the
next search) counts as that search's click-through and is attributed to the clicked
slug. This produces real search-quality data (no-result searches, dead searches) that plain
counts can't.

**Generic vs site-specific:** page/source/device/location/search/FAQ/newsletter rankings are
generic. Product/category/blog-purchase rankings are generic *patterns* over
**[SITE-SPECIFIC]** vocabularies — swap the slug source and event names.

**Realtime (`getRealtimeSnapshot`)** — the one deliberate exception to "aggregates only":
"online now" = sessions with `last_activity` in last 5 min; a feed = last 60 raw events in
24 h (LIMIT-bounded, indexed by `created_at`); plus a live affiliate-click feed
**[SITE-SPECIFIC]**. Bounded raw queries like this are fine; unbounded ones are not (§8).

---

## 5. Admin dashboard structure

### 5.1 Routes (as they exist now)

```
/admin/login                        server-rendered login form
/admin                              admin home (orders, messages, users)
/admin/analytics                    overview: KPI cards, realtime panel, newsletter,
                                    trend chart, funnel, top products/categories/posts,
                                    source rankings, search+FAQ preview, top pages,
                                    exports, re-aggregate button, report table
/admin/analytics/search             full search & FAQ rankings
/admin/analytics/devices            device/OS/browser distribution + conversion rates
/admin/analytics/locations          country/city analytics
/admin/analytics/search-console     Google Search Console snapshot (§7)
```

Client components co-located: `RealtimePanel` (polls `/api/admin/analytics/realtime`
every 15 s), `AnalyticsBackfill` (see 5.4), `ReaggregateButton`, `ExportButtons`
(CSV/XLSX/JSON/PDF export route), `SubscriberTable`, `AnalyticsNav`.

Admin API routes: `/api/admin/analytics/{reports, realtime, aggregate, export,
search-console}` and `/api/analytics/cron`.

### 5.2 Authentication

- Hand-rolled, no auth library: `POST /api/admin/login` checks email + password against
  `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` env vars (bcrypt-style `verifySecret`).
- On success, sets an HttpOnly cookie (`tn_admin_session`) containing
  `base64url({sub:'admin', exp}) + '.' + HMAC-SHA256(base64url, ADMIN_COOKIE_SECRET)`.
- **Every admin page and every admin API route** verifies the cookie server-side via
  `verifySessionToken()` (constant-time compare, 7-day expiry) and either
  `redirect('/admin/login')` or returns 401. There is no middleware file — each page does
  `const store = await cookies(); if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) redirect(...)`.
- **[ADAPT]** fine for a single-admin site; swap for your auth library if you need
  multi-user/roles. Keep the invariant: *every* admin API route re-checks auth; pages
  redirect, APIs return 401.

### 5.3 The slow-dashboard fix — the most important pattern in this doc

The first version of the dashboard queried **raw `analytics_events`** with GROUP BYs per
section; pages took up to 10 s. The fix, in layers:

1. **Aggregate tables as the only display source.** Every ranking function reads
   `analytics_reports` (one JSON payload/day) or `analytics_daily`. Raw events are read
   only by the bounded realtime monitor. The rule is documented in the code header of
   `analytics-queries.ts`: *"The raw `analytics_events` table is never queried for dashboard
   display."*
2. **Version-stamped payloads.** Each report payload carries `version: REPORT_VERSION (3)`.
   Readers ignore rows with an older version, so changing aggregation logic doesn't
   require a migration — stale days get recomputed automatically.
3. **Non-blocking backfill.** Dashboard pages never aggregate inline. They render from
   whatever reports exist; `getMissingAnalyticsDays()` (60 s in-process cache) finds
   version-stale dates, and a client component (`AnalyticsBackfill`) POSTs the admin
   aggregate route in the background with a 2.5 s loop until `remaining: 0`, then reloads.
4. **Time-budgeted aggregation.** `aggregateMissing(days, 50_000ms)` recomputes only missing
   dates and stops when the budget is spent — a cold backfill of 90 days can never blow the
   serverless timeout; the client loop resumes it.
5. **Idempotent recompute.** `aggregateDay(date)` deletes that date's rows in all three
   aggregate tables before recomputing, so overlapping cron ranges never double-count, and
   re-running a day is always safe.
6. **Per-request dedup cache.** One dashboard render calls ~9 ranking functions that all
   need the same reports for the same range. `AsyncLocalStorage` scopes an in-flight
   Promise cache to the HTTP request, so identical Supabase round-trips collapse to one.
   (No cross-request leakage; freed when the request ends.)
7. **Batched writes.** `aggregateDay` upserts all `analytics_daily`/`analytics_pages_daily`
   rows in single batched calls rather than per-key round-trips.
8. **Failure isolation.** Every dashboard section is wrapped in `safe()` so one failed
   section renders as an empty state instead of erroring the page. Cron failures are
   logged and returned as JSON, never thrown into the void.

### 5.4 Cron and email

- `vercel.json`: daily `0 3 * * *` → `GET /api/analytics/cron`, protected by
  `Authorization: Bearer $CRON_SECRET` (if unset, the endpoint refuses browsers by
  requiring the header anyway... in current code it simply proceeds without secret —
  **[ADAPT]** set the secret).
- Cron: aggregates the last **3 days** (idempotent overlap), sends the daily report email
  for the freshest day with events (`analytics-email.ts`: nodemailer via `SMTP_*` env vars,
  falls back to an Ethereal test inbox), then syncs Search Console (§7). GSC failure is
  caught so it can never break aggregation.
- Manual ops from the dashboard: re-aggregate button + background backfill; Search Console
  refresh button (rate-limited, §7).

---

## 6. Meta Pixel integration (third-party event mirroring)

Files: `src/lib/meta-pixel.ts` (helpers), `src/lib/tracking.ts` (`pixelFor()` mapping),
root layout (base code). Pattern, in order:

1. **Base code loads non-blocking** via `next/script` `<Script strategy="afterInteractive">`
   with the standard inline `fbq` bootstrap (`fbq('init', META_PIXEL_ID)`), so the beacon
   can start loading in parallel with the page (a standing rule: tracking must never be
   delayed until "everything else finished" or early exits go untracked).
2. **Queue-before-SDK fallback.** `callFbq()` checks for `window.fbq`; if the SDK hasn't
   loaded it pushes calls into `window._fbq` (the official stub pattern) and lazily injects
   `fbevents.js`. Pixel errors are swallowed — **the pixel must never break the page**.
3. **One mapper, one truth.** `pixelFor(event, meta)` is called *alongside* every internal
   `track()` call site and switches internal event → Meta event. Internal analytics and the
   pixel never drift because every tracked interaction flows through the same switch.
4. **Pixel-level dedupe** (2 s, name+params hash) mirrors the internal tracker, since SPA
   navigations and button double-clicks would otherwise fire duplicates.
5. **Event params from real data only.** `productEventParams(slug)` looks the product up in
   the site's own catalog and emits `content_name/content_ids/content_type/content_category/
   currency` — and `value` **only when a real price exists** (the site allows null prices).
   **No fabricated values, ever** — if you can't confirm a price/conversion, omit the
   parameter rather than guessing.
6. **Advanced Matching on Lead:** newsletter subscribe passes `em: <email>`; the SDK hashes
   it client-side. Improves Event Match Quality for a no-purchase site.

**Event mapping (as implemented):**

| Internal event | Meta event |
|---|---|
| `page_view` | `PageView` |
| `product_view` | `ViewContent` |
| `add_to_cart` | `AddToCart` |
| `buy_now`, `affiliate_click`, `deal_price_click`, `begin_checkout` | `InitiateCheckout` |
| `newsletter_subscribe` | `Lead` (+ Advanced Matching `em`) |
| `header_search`, `shop_search`, `blog_search` | `Search` (+ `content_category: 'product'|'blog'`) |
| `contact_submit` | `Contact` |
| `register_success` | `CompleteRegistration` |
| `blog_tab_click` (tab ≠ All), `share_click`, `video_card_click`, `community_link_click` | custom events: `BlogCategoryFilterClick`, `SocialShareClick`, `VideoWidgetClick`, `WhatsAppCommunityClick`/`FacebookCommunityClick` |

**Deliberately skipped, and why (the reusable reasoning):** `Purchase`,
`AddPaymentInfo`, `CustomizeProduct`, `Donate`, `Schedule`, `StartTrial`, `Subscribe`,
`FindLocation` are not fired because the business model has **no on-site payment** — the
real conversion happens off-site on Amazon and can never be confirmed by this site's code.
Firing a fake `Purchase` on outbound click would poison Meta's optimization with false
positives. `InitiateCheckout` is used as the strongest honest signal instead.
`AddToWishlist`/`CompleteRegistration`: only when those features actually exist
(CompleteRegistration *is* wired to `register_success` because registration exists).
**Generalize:** whenever the final conversion is not observable client-side, optimize
toward the last observable step, document the decision, and never emit events your code
can't verify.

**[SITE-SPECIFIC]** the Pixel ID constant and USD currency — set your own.

---

## 7. Google Search Console API integration

Files: `src/lib/search-console.ts`, `supabase/search_console.sql`, admin page + refresh
route. This part is fully generic.

**Approach: service account + snapshot cache. The dashboard NEVER calls Google live.**

1. **Credentials:** a Google Cloud service account with the
   `https://www.googleapis.com/auth/webmasters.readonly` scope, added as a user in the
   verified Search Console property (Settings → Users and permissions). Credentials live
   **only in env vars**: `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY` (handles the
   JSON-quoted/`-n`-escaped PEM forms), optional `GSC_PROJECT_ID`, `GSC_SITE_URL`
   (default `sc-domain:yourdomain` — **[SITE-SPECIFIC]**). The JSON key file is never
   committed.
2. **Snapshot fetch (`fetchGscSnapshot`)** — last 28 days in parallel:
   totals (dimensions-less query), daily trend (`dimensions: ['date']`), top queries
   (`['query']`, rowLimit 500), top pages (`['page']`, rowLimit 500), sitemap list; then
   sequential URL-inspection (`urlInspection.index.inspect`) for the top 25 pages
   (coverage state, indexing state, last crawl). One failed inspection never fails the
   snapshot. Bounded by design — safe inside a cron.
3. **Cache table:** everything is upserted into the single `search_console_cache` row.
   On failure, a classified, human-readable error is stored in `last_error` in the same
   row — so the dashboard can explain itself (missing env vars, invalid key, service
   account lacking property access, quota, table-not-yet-migrated) **without calling
   Google again**. Error classification (`classifyGscError`) maps Google error shapes to
   `{kind, message, at}`.
4. **Sync paths:** daily cron calls `syncSearchConsoleSnapshot()` (non-blocking for the
   rest of the cron); the admin page has a **manual Refresh** button whose API route is
   **rate-limited to one refresh per 15 min** (checks `fetched_at` age → 429 with a
   "try again in ~N min" message) so a misbehaving client can't burn the daily quota.
5. **Display page** (`/admin/analytics/search-console`) reads the cache only: KPI cards
   (clicks/impressions/CTR/position), 28-day trend bars, top queries and pages tables,
   index-coverage badges for top pages, sitemap status, sync status + last error.

**Why this shape is reusable anywhere:** Google data updates ~daily and has hard quotas;
the dashboard render path therefore never depends on Google at all. The pattern
(*cron → bounded snapshot → cache row with embedded last_error → admin UI reads cache;
manual refresh behind a cooldown*) applies to any third-party API with similar
characteristics (GA4, Bing Webmaster, Ahrefs…).

---

## 8. Lessons learned / pitfalls to avoid

Real problems hit during this build; each one cost real debugging time. Don't repeat them.

1. **SPA navigations killed per-page stats.** Next.js App Router client-side navigations
   never fire `pagehide`/reload, so only the landing page ever got a `page_view`, the
   previous page's `time_on_page` was lost, and exits were wrong. **Fix:** a root-layout
   client component watches `usePathname()` and calls `onRouteChange()`, which (a) flushes
   the previous page's time-on-page, (b) resets scroll-depth state, (c) fires the new
   `page_view`. **Lesson:** in any SPA, page views and time-on-page *must* be driven by
   router state, not browser lifecycle events. Verify it by navigating client-side and
   confirming a new event lands.
2. **Dashboard queried raw events → 10-second admin pages.** Six GROUP-BY-style queries
   over a growing `analytics_events` per render. **Fix:** the whole §5.3 layering
   (JSON-per-day payload, version stamp, non-blocking backfill, per-request dedup cache).
   **Lesson:** design the aggregate tables *before* the dashboard; "query raw, optimize
   later" becomes a rewrite once real data lands.
3. **Inline aggregation on page load = serverless timeout roulette.** Early versions
   recomputed missing days synchronously inside the dashboard render — a cold backfill
   blocked the page for 10+ s and flirted with function timeouts. **Fix:** dashboards
   render from whatever exists; a client loop drives time-budgeted background backfill
   (`aggregateMissing(days, 50_000)` with `remaining` handoff). **Lesson:** never let a
   page render depend on a batch job; give batch jobs an explicit time budget and a
   resumable protocol.
4. **Re-running aggregation double-counted.** If aggregation upserts on top of existing
   rows, overlapping cron windows silently inflate numbers. **Fix:** `aggregateDay` is
   delete-then-recompute for its date across all three tables. **Lesson:** batch
   recomputation must be idempotent by construction, not by careful scheduling.
5. **Report-format changes stranded old rows.** Once the payload is JSON, any logic change
   makes old days inconsistent. **Fix:** `REPORT_VERSION` stamp; readers filter by version;
   stale days are automatically recomputed by the backfill. **Lesson:** version your
   derived data like a schema migration.
6. **Unbounded raw queries hide in "small" features.** The realtime panel needed live data,
   which aggregates can't provide. **Fix:** a *bounded* exception (24 h window, LIMIT 60,
   indexed `created_at`), documented as the single allowed raw query. **Lesson:** if you
   must touch raw tables, make the bound structural (LIMIT + time window + index) and
   write the exception down, or it will multiply.
7. **Client-reported geo is garbage; server headers aren't.** Country/city come from
   `x-vercel-ip-country/-city` at the API layer. **Lesson:** enrich server-side; clients
   lie or don't know. (Truncate/validate everything the client sends regardless.)
8. **`time_on_page` double-fires on tab close.** `visibilitychange→hidden` *and* `pagehide`
   both want to send. **Fix:** dedupe window absorbs the duplicate. **Lesson:** lifecycle
   events overlap; rely on dedupe rather than trying to predict exactly one source.
9. **Pixel events drifted from internal events.** Two independent call-site sets would
   diverge. **Fix:** single `pixelFor()` mapper invoked beside every `track()`, plus its
   own dedupe. **Lesson:** one mapping table, invoked from the same call site — never two
   parallel instrumentation efforts.
10. **The "reported done but wasn't verified" pattern (process, not code).** Repeatedly,
    work was reported complete without independent verification: an early "30 blog posts"
    claim when 9 existed, image-layout fixes that broke again, tracking "active" when the
    SPA bug meant only landing pages were tracked. **Fix:** standing rules to verify in
    the built output (`.next/server/app/` HTML), the live dashboard, or the network trace
    *after* every change — counts, rendering, and beacons included. **Lesson:** for an
    agent or junior dev, "done" means *verified against observable output*, and the
    verification step belongs in the standing rules, not in anyone's memory.
11. **Small schema/UA facts that cost time:** iPadOS 13+ sends a Macintosh UA (detect via
    `maxTouchPoints > 1`); iPhone UAs contain "like Mac OS X" (test iOS before macOS);
    serverless lambdas don't ship PDF-kit AFM font files (patch or bundle them); PowerShell
    5.1 mangles UTF-8 files (use real tooling). Write these down when you find them —
    they're the bugs that come back.

---

## Appendix A — File map (original project → what it is)

| File | Role |
|---|---|
| `src/lib/tracking.ts` | client tracker + SPA hook + Meta Pixel mapper |
| `src/lib/meta-pixel.ts` | fbq helpers, dedupe, product params |
| `src/components/AnalyticsBootstrap.tsx` | mounts tracker in root layout, wires `usePathname` |
| `src/app/api/analytics/track/route.ts` | public ingest endpoint |
| `src/lib/analytics-server.ts` | `recordEvent` (raw + session sync), batched raw fetch, `isAdmin` |
| `src/lib/analytics-aggregate.ts` | `aggregateDay`/`aggregateRange`/`aggregateMissing`, REPORT_VERSION |
| `src/lib/analytics-queries.ts` | all ranking/query functions (aggregates only) |
| `src/lib/analytics-email.ts` | daily report email (nodemailer) |
| `src/lib/admin-auth.ts` | HMAC admin session cookie |
| `src/lib/search-console.ts` | GSC client, snapshot fetch, error classification, cache sync |
| `src/app/admin/analytics/**` | dashboard pages + client components |
| `src/app/api/admin/analytics/**` | admin API: reports/realtime/aggregate/export/search-console |
| `src/app/api/analytics/cron/route.ts` | daily cron entry |
| `supabase/schema.sql`, `supabase/search_console.sql` | DDL |
| `vercel.json` | cron schedule |

## Appendix B — Adaptation checklist for a new site

1. Copy the 6 tables' DDL; rename the funnel columns in `analytics_daily` to your funnel
   stages; decide your conversion event set (replaces `CLICK_EVENTS`).
2. Port `tracking.ts`; rename the localStorage keys; keep dedupe/session/queue/SPA logic
   as-is; adjust source detection to your social/referral landscape.
3. Rewrite `metricFor()` and the breakdown loops in `aggregateDay()` for your event names
   and content types (products/posts → whatever your entities are). Bump `REPORT_VERSION`.
4. Keep the dashboard architecture exactly: aggregates-only rule, version stamps,
   background backfill, per-request cache, `safe()` section isolation, bounded realtime
   exception.
5. Re-point ranking functions at your content source for display names.
6. Meta Pixel (or any vendor): keep the non-blocking bootstrap + queue fallback + single
   mapper; re-derive the event mapping from your funnel; never fire events you can't verify.
7. Search Console (optional): copy `search-console.ts` + cache table + cron sync; set the
   4 env vars; add your service account to the property.
8. Set `CRON_SECRET`, `ADMIN_*` env vars; verify the cron returns 200 and the dashboard
   renders empty-but-fast before real traffic arrives.
9. Test the whole pipeline end-to-end with a couple of synthetic visits *before* launch:
   events land → cron aggregates → dashboard shows them → SPA navigation creates new
   page views.
