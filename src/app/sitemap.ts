import type { MetadataRoute } from 'next'
import { PRODUCTS, SHOP_VIEWS } from '@/data/products'
import { POSTS, BlogPostImage } from '@/data/posts'
import { CATEGORIES } from '@/data/categories'

const SITE = 'https://gadgeterea.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/deals`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = [
    ...CATEGORIES.map((c) => ({
      url: `${SITE}/shop/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...SHOP_VIEWS.map((v) => ({
      url: `${SITE}/shop/${v.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]

  const productRoutes: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    ...(p.addedAt ? { lastModified: new Date(p.addedAt) } : {}),
    changeFrequency: 'weekly',
    priority: 0.8,
    images: p.imageUrl ? [`${SITE}${p.imageUrl}`] : undefined,
  }))

  const blogRoutes: MetadataRoute.Sitemap = POSTS.map((p) => {
    const inlineImages = p.content
      .filter((b): b is BlogPostImage => typeof b === 'object' && 'image' in b && 'alt' in b)
      .map((b) => `${SITE}${b.image}`)
    const allImages = [
      ...(p.heroImage ? [`${SITE}${p.heroImage}`] : []),
      ...inlineImages,
    ]
    return {
      url: `${SITE}/blog/${p.slug}`,
      lastModified: p.lastUpdated ? new Date(p.lastUpdated) : new Date(p.date),
      changeFrequency: 'monthly',
      priority: 0.7,
      images: allImages.length > 0 ? allImages : undefined,
    }
  })

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes]
}
