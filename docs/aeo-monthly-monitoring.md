# GadgetErea — Monthly AEO Monitoring Checklist

Run once a month (and after any new post/product batch) to keep the
SEO + AEO (AI answer-engine optimization) pipeline healthy. Record the
date + a short result note each time.

---

## 1. Indexing & crawl health

- [ ] Google Search Console → Pages: confirm no unexpected "Discovered – not indexed", "Crawled – not indexed", or 4xx/5xx. New posts should be indexing within ~1 week.
- [ ] GSC → Sitemaps: confirm `/sitemap.xml` last-read date is recent and "discovered pages" matches the live page count (40 blog + 33 products + static pages).
- [ ] Fetch-as-Google a freshly published post and confirm Googlebot renders the JSON-LD (view "rendered" tab).
- [ ] Confirm `/robots.txt` still serves and Googlebot is allowed (`googlebot` group, `allow: /`) — no accidental global block.

## 2. Schema / rich-results validity

- [ ] Rich Results Test on one review post (e.g. `/blog/jack-rose-k1-travel-steamer-review`) → Product + AggregateRating must validate, no errors.
- [ ] Rich Results Test on one buying-guide post → FAQPage must validate.
- [ ] Rich Results Test on one product page (`/product/<slug>`) → Product + Offer valid.
- [ ] Spot-check BreadcrumbList appears on a blog post, a product, and `/shop` (view page source, search `BreadcrumbList`).

## 3. AI answer-engine visibility

- [ ] Query the site's brand/top terms in 2–3 AI tools (ChatGPT, Perplexity, Google AI Overviews) — e.g. "best 4k webcam under $100", "noise cancelling headphones buying guide". Note whether GadgetErea is cited/mentioned.
- [ ] Check `llms.txt` is reachable at `https://gadgeterea.com/llms.txt` (200, lists all posts/products) and content is current after any new post.
- [ ] For new posts: confirm the direct-answer intro (first paragraph) answers the query in plain language, question-style H2s present, and an `<ul>` list exists (these are the AEO citation triggers).

## 4. Core Web Vitals (perf still on track)

- [ ] Run Lighthouse (mobile) on `/`, one blog post, and one product page. Compare against `docs/lighthouse-baseline-2026-09-06.json` — LCP, TBT, CLS should be stable or improving.
- [ ] GSC → Core Web Vitals report: no regressions into "needs improvement" / "poor".

## 5. Ranking & search-console signals

- [ ] GSC → Performance: brand + primary keyword impressions/clicks trending up, no sharp drop.
- [ ] Note any top queries where GadgetErea appears but click-through is low (opportunity to sharpen meta title/description).
- [ ] Admin dashboard → search/FAQ/blog rank: confirm no ranking leaderboard is silently broken (per standing rule: tracking auto-picks-up new content).

## 6. Content freshness

- [ ] Scan posts whose `lastUpdated` / `date` is > 6 months old for stale specs/prices; update the intro answer + stats if specs changed.
- [ ] Confirm "newest-first" ordering still holds on `/blog` and the Home "Latest Blog Posts" grid (screenshot both) after any new post.

## 7. Hygiene

- [ ] No broken internal links (run a link check, or scan GSC for 404s pointing to internal pages).
- [ ] No new pages missing canonical / meta description / H1.
- [ ] `llms.txt`, `robots.txt`, and `sitemap.xml` all reference the correct domain `gadgeterea.com` (no `.vercel.app` or old "technest-bd" leakage).

---

## Monthly log

| Date | Result / notes | Next action |
|------|----------------|-------------|
| 2026-09-11 | Baseline established — Phases 2A/2B/3/4/5 shipped; checklist drafted | First full pass next month |