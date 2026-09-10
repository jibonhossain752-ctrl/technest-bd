import { POSTS } from '@/data/posts'
import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/data/categories'

const SITE = 'https://gadgeterea.com'

export const dynamic = 'force-static'

export function GET() {
  const lines: string[] = []

  lines.push('# GadgetErea')
  lines.push('')
  lines.push(
    '> GadgetErea is a US-focused tech affiliate publication that reviews and',
  )
  lines.push(
    '> curates trending gadgets, laptops, smartphones, audio and smart-home gear,',
  )
  lines.push(
    '> with every product linking out to its Amazon listing. Content is original,',
  )
  lines.push('> human-written, fact-checked, and updated as specs change.')
  lines.push('')

  lines.push('## Core Pages')
  lines.push('')
  lines.push(`- [Home](${SITE}/): Trending gadgets and Amazon finds, updated weekly`)
  lines.push(`- [Shop](${SITE}/shop): Full product catalog across all categories`)
  lines.push(`- [Deals](${SITE}/deals): Hand-picked weekly discounts`)
  lines.push(`- [Blog](${SITE}/blog): Reviews, buying guides, tips and explainers`)
  lines.push(`- [About](${SITE}/about): What GadgetErea is and how we pick products`)
  lines.push(`- [FAQ](${SITE}/faq): Common questions about the store and affiliate model`)
  lines.push(`- [Contact](${SITE}/contact): How to reach us`)
  lines.push('')

  lines.push('## Product Categories')
  lines.push('')
  for (const c of CATEGORIES) {
    lines.push(`- [${c.name}](${SITE}/shop/${c.slug})`)
  }
  lines.push('')

  lines.push('## Blog Posts')
  lines.push('')
  const sortedPosts = [...POSTS].sort(
    (a, b) =>
      new Date(b.lastUpdated ?? b.date).getTime() -
      new Date(a.lastUpdated ?? a.date).getTime(),
  )
  for (const p of sortedPosts) {
    lines.push(`- [${p.title}](${SITE}/blog/${p.slug}): ${p.excerpt}`)
  }
  lines.push('')

  lines.push('## Products')
  lines.push('')
  for (const p of PRODUCTS) {
    lines.push(`- [${p.name}](${SITE}/product/${p.slug})`)
  }
  lines.push('')

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
    },
  })
}