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
}

const ORDERS_KEY = 'technest-orders'
const SUBSCRIPTIONS_KEY = 'technest-subscriptions'
const USERS_KEY = 'technest-users'

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

/**
 * Persists the marketing preference (the same `subscribed` field used on
 * user records from the register page and on order records from checkout).
 */
export function saveSubscriptionPreference(contact: string, subscribed: boolean) {
  const subs = read<{ contact: string; subscribed: boolean; at: string }>(
    SUBSCRIPTIONS_KEY,
  )
  const next = subs.filter((s) => s.contact !== contact)
  next.push({ contact, subscribed, at: new Date().toISOString() })
  write(SUBSCRIPTIONS_KEY, next)
  return subscribed
}

export function placeOrder(
  contact: ContactInfo,
  items: CartItem[],
  subscribed: boolean,
): OrderRecord {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  )
  const order: OrderRecord = {
    id: `TN-${Date.now()}`,
    contact,
    items: items.map((i) => ({
      name: i.product.name,
      qty: i.qty,
      price: i.product.price,
    })),
    total,
    subscribed,
    placedAt: new Date().toISOString(),
  }
  const orders = read<OrderRecord>(ORDERS_KEY)
  orders.unshift(order)
  write(ORDERS_KEY, orders)

  if (contact.phone) {
    saveSubscriptionPreference(contact.phone, subscribed)
  } else if (contact.email) {
    saveSubscriptionPreference(contact.email, subscribed)
  }

  return order
}

export function registerUser(data: {
  name: string
  email: string
  phone: string
  subscribed: boolean
}) {
  const users = read<Record<string, unknown> & { subscribed: boolean }>(
    USERS_KEY,
  )
  users.push({ ...data, createdAt: new Date().toISOString() })
  write(USERS_KEY, users)
  saveSubscriptionPreference(data.phone || data.email, data.subscribed)
  return data
}
