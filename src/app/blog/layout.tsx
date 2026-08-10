import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gadget Reviews & Amazon Finds Blog',
  description:
    'Best Amazon finds this week — trending gadget reviews and buying guides, from cool tech gadgets under $50 to useful home gadgets and viral TikTok finds.',
  alternates: { canonical: '/blog' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://gadgeterea.com/blog',
    title: 'Gadget Reviews & Amazon Finds Blog | GadgetErea',
    description:
      'Best Amazon finds this week, trending gadget reviews and buying guides — tested and ranked at GadgetErea.',
    images: [
      {
        url: '/images/blog/best-tech-gifts-under-50.jpg',
        width: 1200,
        height: 675,
        alt: 'GadgetErea - trending gadgets and the best Amazon finds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gadget Reviews & Amazon Finds Blog | GadgetErea',
    description:
      'Best Amazon finds this week, trending gadget reviews and buying guides — tested and ranked at GadgetErea.',
    images: ['/images/blog/best-tech-gifts-under-50.jpg'],
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
