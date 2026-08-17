'use client'

import type { Product } from '@/data/products'
import ProductCard from './ProductCard'
import { useCart } from '@/context/useCart'

interface ProductGridProps {
  products: Product[]
  eagerFirst?: number
}

export default function ProductGrid({ products, eagerFirst = 0 }: ProductGridProps) {
  const { addToCart } = useCart()

  return (
    <div className="product-grid">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={addToCart}
          eager={i < eagerFirst}
        />
      ))}
    </div>
  )
}
