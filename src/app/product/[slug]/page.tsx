export const revalidate = 7200

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts, PRODUCTS } from '@/data/products'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProductGrid from '@/components/ProductGrid'
import { ProductDetailHero } from '@/components/ProductDetail'
import Reveal from '@/components/ui/Reveal'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }

  const title = product.metaTitle ?? product.name
  const description = product.metaDescription ?? product.description
  const keywords = product.primaryKeyword
    ? [product.primaryKeyword, ...(product.secondaryKeywords ?? [])]
    : undefined

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/product/${product.slug}`,
      siteName: 'GadgetErea',
      ...(product.imageUrl
        ? {
            images: [
              {
                url: `https://gadgeterea.com${product.imageUrl}`,
                width: 1200,
                height: 1200,
                alt: product.altText ?? product.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: product.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(product.imageUrl
        ? { images: [`https://gadgeterea.com${product.imageUrl}`] }
        : {}),
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const related = getRelatedProducts(product)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.id,
    ...(product.imageUrl
      ? {
          image: [
            `https://gadgeterea.com${product.imageUrl}`,
          ],
        }
      : {}),
    ...(product.rating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      ...(product.price != null ? { price: product.price } : {}),
      availability: 'https://schema.org/InStock',
      ...(product.buyUrl ? { url: product.buyUrl } : {}),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb
        crumbs={[
          { label: 'Shop', href: '/shop' },
          { label: product.category, href: `/shop/${product.categorySlug}` },
          { label: product.name },
        ]}
      />
      <section className="product-detail container">
        <Reveal>
          <ProductDetailHero product={product} />
        </Reveal>
      </section>
      <section className="related-products">
        <div className="container">
          <div className="section-head">
            <h2>You May Also Like</h2>
            <p>Related products in {product.category}</p>
          </div>
          <Reveal>
            <ProductGrid products={related} />
          </Reveal>
        </div>
      </section>
    </>
  )
}
