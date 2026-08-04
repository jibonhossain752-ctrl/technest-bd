'use client'

import type { Product } from '@/data/products'
import ProductCard from './ProductCard'
import { useCart } from '@/context/useCart'

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  const { addToCart } = useCart()

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={addToCart}
        />
      ))}
    </div>
  )
}
