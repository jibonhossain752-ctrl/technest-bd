export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  author: string
  emoji: string
  readTime: string
  content: string[]
  metaTitle?: string
  metaDescription?: string
  heroImage?: string
  altText?: string
  dealCard?: {
    productSlug: string
    price: string
    affiliateUrl: string
  }
  faq?: { question: string; answer: string }[]
  lastUpdated?: string
  warranty?: string
  primaryKeyword?: string
  secondaryKeywords?: string[]
}

export const POSTS: BlogPost[] = []

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  POSTS.find((p) => p.slug === slug)
