import type { MetadataRoute } from 'next'

const SITE = 'https://gadgeterea.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          'Googlebot',
          'Googlebot-Image',
          'Googlebot-News',
          'Bingbot',
          'DuckDuckBot',
          'Applebot',
          'YandexBot',
          'Baiduspider',
        ],
        allow: '/',
        disallow: ['/cart', '/checkout', '/account', '/login', '/register', '/admin', '/api/'],
      },
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'PerplexityBot',
          'Google-Extended',
          'Applebot-Extended',
          'cohere-ai',
          'CCBot',
          'Bytespider',
          'Meta-ExternalAgent',
        ],
        allow: '/',
        disallow: ['/cart', '/checkout', '/account', '/login', '/register', '/admin', '/api/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/account', '/login', '/register', '/admin', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
