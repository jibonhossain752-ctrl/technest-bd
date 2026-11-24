import { PRODUCTS } from './products'

export interface Category {
  name: string
  slug: string
  icon: string
  description: string
  count: number
}

const CATEGORY_META = [
  { name: 'Laptops & PCs', slug: 'laptops', icon: '💻' },
  { name: 'Smartphones', slug: 'smartphones', icon: '📱' },
  { name: 'Audio & Wearables', slug: 'audio-wearables', icon: '🎧' },
  { name: 'Gaming Gear', slug: 'gaming', icon: '🎮' },
  { name: 'Accessories', slug: 'accessories', icon: '⌨️' },
  { name: 'Cameras', slug: 'cameras', icon: '📷' },
  { name: 'Smart Home', slug: 'smart-home', icon: '🏠' },
] as const

export const CATEGORIES: Category[] = CATEGORY_META.map((meta) => ({
  ...meta,
  count: PRODUCTS.filter((p) => p.categorySlug === meta.slug).length,
  description: `Shop the best ${meta.name.toLowerCase()} at unbeatable prices with genuine warranty and fast delivery across the USA.`,
}))

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug)

/**
 * Categories that exist for Quick Look ONLY — no shop aisle, no /shop/<slug>
 * route, no products. First use: Cars (2026-11-24), for the US-market car spec
 * sheets. A car is not something this store sells, so it must not appear in the
 * Shop; the Quick Look data layer still needs a category name and slug for the
 * entry, and this is the list it reads them from.
 *
 * Anything here is deliberately kept OUT of `CATEGORIES`, which is what the
 * shop routes, the shop grid and the sitemap are built from.
 */
export const QUICK_LOOK_CATEGORIES: Pick<Category, 'name' | 'slug' | 'icon'>[] = [
  { name: 'Cars', slug: 'cars', icon: '🚗' },
]

/** True when the slug is a real shop aisle (a /shop/<slug> page exists). */
export const isShopCategory = (slug: string): boolean =>
  CATEGORIES.some((category) => category.slug === slug)

/** A Quick Look-only category, which has no shop aisle behind it. */
export const getQuickLookCategoryBySlug = (
  slug: string,
): Pick<Category, 'name' | 'slug' | 'icon'> | undefined =>
  QUICK_LOOK_CATEGORIES.find((category) => category.slug === slug)

export const getProductsByCategory = (slug: string) =>
  PRODUCTS.filter((p) => p.categorySlug === slug)
