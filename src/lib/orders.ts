import type { CartItem } from '@/context/cart-context'

export interface ContactInfo {
  name: string
  phone: string
  email?: string
}

export interface OrderRecord {
  id: string
  contact: ContactInfo
  items: { name: string; qty: number; price: number }[]
  total: number
  subscribed: boolean
  placedAt: string
  status: string
}

export async function placeOrder(
  contact: ContactInfo,
  items: CartItem[],
  subscribed: boolean,
): Promise<OrderRecord> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact, items, subscribed }),
  })
  if (!res.ok) {
    throw new Error('Order could not be placed. Please try again.')
  }
  const json = await res.json()
  return json.order as OrderRecord
}

export async function getOrdersByEmail(email: string): Promise<OrderRecord[]> {
  const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.orders as OrderRecord[]) ?? []
}
