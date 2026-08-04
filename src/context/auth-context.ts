import { createContext } from 'react'
import type { AuthResult, PublicUser } from '../lib/auth'

export interface AuthContextValue {
  user: PublicUser | null
  login: (email: string, password: string) => AuthResult
  register: (data: {
    name: string
    email: string
    phone: string
    password: string
    subscribed: boolean
  }) => AuthResult
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
