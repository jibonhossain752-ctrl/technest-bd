import Link from 'next/link'
import { CATEGORIES } from '@/data/categories'

interface CategoryChipsProps {
  activeSlug?: string
  heading?: string
}

export default function CategoryChips({
  activeSlug = 'all',
  heading,
}: CategoryChipsProps) {
  const isActive = (slug: string) =>
    activeSlug === 'all' ? slug === 'all' : slug === activeSlug

  return (
    <div className="category-chips-wrap">
      {heading && <h3 className="category-chips-heading">{heading}</h3>}
      <nav className="category-chips" aria-label="Browse categories">
        <Link
          href="/shop"
          className={`category-chip${isActive('all') ? ' active' : ''}`}
        >
          All Products
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className={`category-chip${isActive(cat.slug) ? ' active' : ''}`}
          >
            {cat.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
