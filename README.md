# GadgetErea

An e-commerce store for tech products in Bangladesh, built with **Next.js**.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) — React framework & build tool
- **React 19**
- **TypeScript 6**
- **framer-motion** — animations
- **Plain CSS** — single global stylesheet (`src/app/globals.css`), CSS custom properties for theming
- **oxlint** — linting

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Next.js dev server         |
| `npm run build` | Production build (`next build`)      |
| `npm run start` | Serve the production build           |
| `npm run lint`  | Run oxlint                           |

## Project Structure

- `src/app/` — Next.js App Router pages (routes for shop, product, cart, checkout, blog, auth, etc.)
- `src/components/` — React components (Navbar, Footer, ProductCard, HeroCarousel, ShopCatalog, ...)
- `src/data/` — typed data modules (products, categories, posts, faqs)
- `src/context/` — React context (cart with localStorage persistence)
- `src/lib/` — helpers (orders, localStorage persistence)

## Data

All product/category/blog data is hardcoded in typed modules under `src/data/` — there is no database or API.

## Deploying

Optimized for **Vercel** — the framework is auto-detected as Next.js.
