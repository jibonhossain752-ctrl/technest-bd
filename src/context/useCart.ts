import { useContext } from 'react'
import { CartContext } from './cart-context'
import type { CartContextValue } from './cart-context'

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
