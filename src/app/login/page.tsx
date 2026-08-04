'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/useAuth'
import PageHeader from '@/components/ui/PageHeader'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !password) return
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error ?? 'Could not sign you in.')
      return
    }
    router.push('/account')
  }

  return (
    <>
      <PageHeader title="Login" subtitle="Welcome back to TechNest BD" />

      <section className="auth container">
        <div className="auth-card">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="form-error">{error}</p>}
            <div className="auth-row">
              <label className="checkbox-option">
                <input type="checkbox" /> Remember me
              </label>
              <Link href="/register" className="link">
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="btn btn-primary block">
              Login
            </button>
          </form>
          <p className="auth-switch">
            New to TechNest BD? <Link href="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </>
  )
}
