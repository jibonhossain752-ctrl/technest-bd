import Link from 'next/link'
import type { Product } from '@/data/products'
import type { QuickLookEntry } from '@/data/quick-look'
import { productImageAlt } from '@/lib/imageAlt'
import { responsiveSrcset } from '@/lib/images'

interface QuickLookCardProps {
  product: Product
  entry: QuickLookEntry
}

/**
 * Browse card for the /quick-look listing. Reuses the shop card's own classes
 * (.product-card, .product-img, .product-info) so the grid stays visually
 * identical to Shop and Deals — but the whole card links to the Quick Look
 * spec sheet and it carries NO cart or buy actions. The detail page is where
 * the affiliate button lives, so the listing stays a browsing surface.
 *
 * Alt text comes from the shared helper (src/lib/imageAlt.ts), never a literal.
 */
export default function QuickLookCard({ product, entry }: QuickLookCardProps) {
  return (
    <article className="product-card">
      <Link
        href={`/quick-look/${product.slug}`}
        prefetch={false}
        className="product-img"
        aria-label={`${entry.displayName} spec sheet`}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            srcSet={responsiveSrcset(product.imageUrl)}
            sizes="(min-width: 768px) 300px, 45vw"
            alt={productImageAlt(product)}
            className="product-img-el"
            loading="lazy"
            width={400}
            height={400}
          />
        ) : (
          <span className="product-emoji" role="img" aria-label={productImageAlt(product)}>
            {product.image}
          </span>
        )}
        <span className="ql-card-tag">Spec sheet</span>
      </Link>

      <div className="product-info">
        <Link href={`/shop/${product.categorySlug}`} className="product-cat">
          {product.category}
        </Link>
        <Link href={`/quick-look/${product.slug}`} prefetch={false} className="product-name">
          {entry.displayName}
        </Link>
        <p className="ql-card-note">
          {entry.specs.reduce(
            (total, group) => total + (group.rows?.length ?? 0) + (group.items?.length ?? 0),
            0,
          )}{' '}
          specs across {entry.specs.length} categories
        </p>
        <Link href={`/quick-look/${product.slug}`} prefetch={false} className="ql-card-cta">
          Read the spec sheet →
        </Link>
      </div>
    </article>
  )
}
