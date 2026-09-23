# Admin Panel — Base Code Export

A copy of the admin panel UI/structure from the GadgetErea site (Next.js 16 App Router,
React 19, TypeScript, single global CSS file), exported so a **new, separate website** can
rebuild its own admin panel from the same structural patterns.

**Companion document:** `docs/admin-analytics-system-overview.md` (in the source repo)
explains the backend this UI talks to — the tracking pipeline, database schema, aggregation
strategy, and integration patterns. Read that first; this folder is only the interface layer.

## What's included

```
src/
  app/admin/
    page.tsx                       /admin        — server guard + Overview page
    AdminDashboard.tsx             Overview UI   — users/orders/messages tables
    login/
      page.tsx                     /admin/login  — client login form
      layout.tsx                   route segment layout (force-dynamic passthrough)
    analytics/
      page.tsx                     /admin/analytics — overview dashboard (server component)
      AnalyticsNav.tsx             tab nav across analytics pages
      AnalyticsBackfill.tsx        client: background aggregate backfill loop (see flags)
      RealtimePanel.tsx            client: live events feed, 15s polling
      ExportButtons.tsx            export link bar (xlsx/pdf/csv/json)
      ReaggregateButton.tsx        client: manual re-aggregation trigger
      SubscriberTable.tsx          client: sortable/searchable table (see flags)
      subscriber-types.ts          TS types for the subscriber table
      devices/page.tsx             /admin/analytics/devices
      locations/page.tsx           /admin/analytics/locations
      search/page.tsx              /admin/analytics/search
      search-console/page.tsx      /admin/analytics/search-console
      search-console/RefreshButton.tsx   client: manual GSC refresh trigger
  lib-admin-auth.ts                (renamed from src/lib/admin-auth.ts) HMAC-signed session
                                   cookie helpers — the auth pattern used by every guard
  styles/
    admin-core.css                 base admin classes (cards, tables, sections) — sliced
                                   from the site's global stylesheet
    admin-shell.css                shell/topbar/avatar styling
    admin-analytics.css            all analytics-specific classes (trend bars, funnel,
                                   subnav, realtime feed, GSC badges, responsive rules)
```

## Deliberately excluded (per the export rules)

- **All API route handlers** (`src/app/api/**`) — the new site implements its own backend.
  Every `fetch('/api/admin/...')` in these files is a call to an endpoint that does not
  exist in this export; that is intentional. Endpoint shapes are described in the
  companion overview doc (§5) so you can rebuild them.
- **No `.env` files, no credentials, no Pixel IDs, no domain names baked into logic.**
  The auth file reads env vars (`ADMIN_COOKIE_SECRET`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD_HASH`) by name — set your own values.
- **Data-fetching backend logic** (`analytics-queries.ts`, `analytics-aggregate.ts`,
  `analytics-server.ts`, `search-console.ts` — the Supabase query/aggregate layer). These
  files are NOT in the export. The server components' import lines referencing them were
  **left in place intentionally** (they are ordinary code references, no secrets) and each
  affected file carries an `EXPORT NOTE:` header listing exactly which backend functions
  it expects — so the implementing agent knows precisely what to re-implement.

## What is generic / reusable as-is

- **Layout & navigation patterns:** shell + topbar + sub-nav tabs, section blocks, KPI
  card grids, bar/row visualizations, empty states, range-tab selection via URL params
  (`?range=7|30|90`).
- **Auth pattern** (`lib-admin-auth.ts` + the one-line guard in every server page):
  HttpOnly cookie containing a base64url payload + HMAC-SHA256 signature from a server
  secret, constant-time verification, 7-day expiry; server pages `redirect()` on failure,
  API routes return 401. Single-admin scope — swap for a multi-user auth library if needed,
  but keep the invariant: *every* admin page re-checks the cookie server-side.
- **Client component patterns:** polling panel (`RealtimePanel`), debounce+sort+search
  table (`SubscriberTable`), background-task-with-retry loops (`AnalyticsBackfill`,
  `ReaggregateButton`), export-link bar, action buttons with busy/error message states
  (`RefreshButton`).
- **All three CSS files** — pure CSS, no framework; import them (or merge into your global
  stylesheet). They use the site's CSS custom properties (`--primary`, `--accent`) — define
  those on `:root` or find/replace them.

## What assumes GadgetErea's data shape (rebuild for your data)

- **`AdminDashboard.tsx`** — user/order/message shapes (`AdminUser`, `AdminOrder`,
  `AdminMessage`), order status lifecycle, `formatUSD` import from the store's product
  data. Structure is reusable; types and columns are yours to redefine.
- **Analytics server pages** — they import ranking functions from
  `@/lib/analytics-queries` (removed here) and render result types (`TopProductRow`,
  `SourceRankRow`, …) whose fields reflect the affiliate funnel. Keep the render patterns,
  redefine the row shapes to your metrics.
- **`search-console/page.tsx`** — imports types + `gscEnvPresent`/`getSearchConsoleSnapshot`
  from `@/lib/search-console` (removed). The page structure (KPI cards → trend → queries →
  pages → coverage → sitemaps → sync) is the reusable part.
- **`SubscriberTable.tsx`** — subscriber fields (email/name/phone/country/source) match the
  store's newsletter schema; the sort/search/polling logic is generic.

## ⚠️ Files where data-fetching is mixed into the UI (not silently separated)

The following client components contain **live fetch calls to admin API endpoints**, mixed
directly into the component rather than behind a service layer. They were included as-is
per the export rules (they are UI code; the endpoints themselves were excluded), but the
coupling is real — the new site should extract a small API client layer instead of copying
this pattern:

| File | Coupling |
|---|---|
| `src/app/admin/AdminDashboard.tsx` | fetches `/api/admin/users`, `/api/admin/orders`, `/api/admin/messages`, PATCHes `/api/admin/orders/[id]`, calls `/api/admin/logout` inline; also imports `formatUSD` from the storefront's product data module |
| `src/app/admin/analytics/RealtimePanel.tsx` | polls `/api/admin/analytics/realtime` inline every 15 s |
| `src/app/admin/analytics/SubscriberTable.tsx` | fetches `/api/admin/newsletter/subscribers?search&sort&dir` inline with debounce; CSV export link to the same endpoint |
| `src/app/admin/analytics/AnalyticsBackfill.tsx` | POSTs `/api/admin/analytics/aggregate?days=N` in a retry loop; session-storage gating; full page reload on completion |
| `src/app/admin/analytics/ReaggregateButton.tsx` | POSTs `/api/admin/analytics/aggregate?days=3` inline |
| `src/app/admin/analytics/search-console/RefreshButton.tsx` | POSTs `/api/admin/analytics/search-console` inline |
| `src/app/admin/login/page.tsx` | POSTs `/api/admin/login` inline |

The **server components** (`analytics/page.tsx`, `devices/`, `locations/`, `search/`,
`search-console/page.tsx`, `admin/page.tsx`) are cleanly separated: their data access is
via imports from two backend modules (`@/lib/admin-auth` guard + `@/lib/analytics-queries`
or `@/lib/search-console`) that are not part of this export. Each file has an
`EXPORT NOTE:` header at the top naming the exact functions/types it consumes.

`analytics/page.tsx` additionally reads `analytics_reports` directly via a small local
`getReports()` helper (a Supabase `.from('analytics_reports')` query inlined in the page).
It was left in place with a marker comment rather than half-refactored — treat it as
backend code to re-implement.

## Reassembly notes for a new site

1. Recreate the `src/app/admin/**` routes; copy the client components unchanged.
2. Implement your own API endpoints matching the fetch shapes above (or refactor the
   components to a service layer first — recommended).
3. Re-implement the query functions behind the server pages' `EXPORT NOTE` call sites
   (the companion overview doc defines the aggregation strategy that feeds them).
4. Merge the three CSS files into your global styles; define `--primary`/`--accent`.
5. Set `ADMIN_COOKIE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`; port or replace
   `lib-admin-auth.ts`.
6. `robots.txt`: disallow `/admin` (as the source site does).
7. Fix the removed-import server files per their `EXPORT NOTE:` headers; the note in
   `admin/page.tsx` includes the original import line for reference.

## Verification note

The three CSS slices were extracted by line-range from the site's single global stylesheet
(`src/app/globals.css`, sections "Admin dashboard", "Admin", "Admin Analytics"); brace
balance in each slice was verified programmatically after extraction. No `.env`, credential,
or token values exist anywhere in this folder.
