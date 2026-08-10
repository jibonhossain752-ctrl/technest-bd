import type { MetadataRoute } from 'next'

const SITE = 'https://gadgeterea.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/account', '/login', '/register', '/admin', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
