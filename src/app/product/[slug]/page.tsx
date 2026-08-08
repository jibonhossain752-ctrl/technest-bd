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
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const related = getRelatedProducts(product)

  return (
    <>
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
