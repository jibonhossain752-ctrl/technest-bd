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
  { name: 'Networking', slug: 'networking', icon: '📡' },
  { name: 'Cameras', slug: 'cameras', icon: '📷' },
  { name: 'Smart Home', slug: 'smart-home', icon: '🏠' },
] as const

export const CATEGORIES: Category[] = CATEGORY_META.map((meta) => ({
  ...meta,
  count: PRODUCTS.filter((p) => p.categorySlug === meta.slug).length,
  description: `Shop the best ${meta.name.toLowerCase()} at unbeatable prices with genuine warranty and fast delivery across Bangladesh.`,
}))

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug)

export const getProductsByCategory = (slug: string) =>
  PRODUCTS.filter((p) => p.categorySlug === slug)
