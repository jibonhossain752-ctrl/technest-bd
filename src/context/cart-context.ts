import { createContext } from 'react'
import type { Product } from '../data/products'

export interface CartItem {
  product: Product
  qty: number
}

export interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  addToCart: (product: Product) => void
  buyNow: (product: Product, qty: number) => void
  removeFromCart: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
