'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  clearSession,
  getSession,
  loginUser,
  registerUser,
  saveSession,
} from '@/lib/auth'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)

  useEffect(() => {
    const session = getSession()
    if (session) setUser(session)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const result = loginUser(email, password)
    if (result.ok && result.user) {
      setUser(result.user)
      saveSession(result.user)
    }
    return result
  }, [])

  const register = useCallback(
    (data: {
      name: string
      email: string
      phone: string
      password: string
      subscribed: boolean
    }) => {
      const result = registerUser(data)
      if (result.ok && result.user) {
        setUser(result.user)
        saveSession(result.user)
      }
      return result
    },
    [],
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
