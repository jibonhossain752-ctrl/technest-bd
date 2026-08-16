export type SortKey =
  | 'email'
  | 'name'
  | 'phone'
  | 'country'
  | 'city'
  | 'source'
  | 'created_at'

export type SortDir = 'asc' | 'desc'

export interface Subscriber {
  email: string
  name: string
  phone: string
  country: string
  city: string
  source: string
  createdAt: string
}