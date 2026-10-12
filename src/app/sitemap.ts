import type { MetadataRoute } from 'next'
import { getSitemapEntries, SITE } from '@/lib/sitemap-routes'
import { assertSitemapCoverage } from '@/lib/sitemap-coverage'

export default function sitemap(): MetadataRoute.Sitemap {
  // Fails the build if a public page is missing from the sitemap or the
  // sitemap lists something no built page serves.
  assertSitemapCoverage()

  return getSitemapEntries().map((entry) => ({
    url: `${SITE}${entry.path}`,
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    ...(entry.images ? { images: entry.images.map((image) => `${SITE}${image}`) } : {}),
  }))
}
