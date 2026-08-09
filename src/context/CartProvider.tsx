'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '../data/products'
import { getProductBySlug } from '../data/products'
import { CartContext } from './cart-context'
import type { CartItem, CartContextValue } from './cart-context'
import { track, pixelFor } from '@/lib/tracking'

const STORAGE_KEY = 'technest-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { slug: string; qty: number }[]
    return parsed
      .map(({ slug, qty }) => {
        const product = getProductBySlug(slug)
        return product ? { product, qty } : null
      })
      .filter((item): item is CartItem => item !== null)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(loadCart())
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.map((i) => ({ slug: i.product.slug, qty: i.qty }))),
    )
  }, [items])

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.slug === product.slug)
      if (existing) {
        return prev.map((item) =>
          item.product.slug === product.slug
            ? { ...item, qty: item.qty + 1 }
            : item,
        )
      }
      return [...prev, { product, qty: 1 }]
    })
    track('add_to_cart', undefined, {
      product_slug: product.slug,
      product_name: product.name.slice(0, 200),
      qty: 1,
    })
    pixelFor('add_to_cart', { product_slug: product.slug })
  }, [])

  const buyNow = useCallback((product: Product, qty: number) => {
    setItems([{ product, qty }])
    track('buy_now', undefined, {
      product_slug: product.slug,
      product_name: product.name.slice(0, 200),
      qty,
    })
    pixelFor('buy_now', { product_slug: product.slug })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const removed = prev.find((item) => item.product.id === productId)
      if (removed) {
        track('remove_from_cart', undefined, {
          product_slug: removed.product.slug,
          qty: removed.qty,
        })
      }
      return prev.filter((item) => item.product.id !== productId)
    })
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, qty } : item,
        )
        .filter((item) => item.qty > 0),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    track('clear_cart')
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0)
    const total = items.reduce(
      (sum, item) => sum + (item.product.price ?? 0) * item.qty,
      0,
    )
    return {
      items,
      count,
      total,
      addToCart,
      buyNow,
      removeFromCart,
      updateQty,
      clearCart,
    }
  }, [items, addToCart, buyNow, removeFromCart, updateQty, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
