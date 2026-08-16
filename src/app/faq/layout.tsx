import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ – Ordering, Shipping & Returns',
  description:
    'Answers about ordering, shipping, returns and warranties at GadgetErea. Get fast support for your trending gadget and Amazon find orders.',
  alternates: { canonical: '/faq' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://gadgeterea.com/faq',
    title: 'FAQ – Ordering, Shipping & Returns | GadgetErea',
    description:
      'Answers about ordering, shipping, returns and warranties at GadgetErea.',
    images: [
      {
        url: '/images/blog/best-tech-gifts-under-50.webp',
        width: 1200,
        height: 675,
        alt: 'GadgetErea - trending gadgets and the best Amazon finds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ – Ordering, Shipping & Returns | GadgetErea',
    description:
      'Answers about ordering, shipping, returns and warranties at GadgetErea.',
    images: ['/images/blog/best-tech-gifts-under-50.webp'],
  },
}

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
