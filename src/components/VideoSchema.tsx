import { VIDEOS } from '@/data/videos'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gadgeterea.com'

export default function VideoSchema() {
  const schema = VIDEOS.map((v) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnail ? `${SITE_URL}${v.thumbnail}` : undefined,
    contentUrl: v.href,
    url: v.href,
    publisher: {
      '@type': 'Organization',
      name: 'GadgetErea',
    },
    inLanguage: 'en',
  }))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
