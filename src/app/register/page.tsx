'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/useAuth'
import PageHeader from '@/components/ui/PageHeader'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    subscribed: false,
  })

  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    const result = register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      subscribed: form.subscribed,
    })
    if (!result.ok) {
      setError(result.error ?? 'Could not create your account.')
      return
    }
    router.push('/account')
  }

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({
        ...prev,
        [key]:
          e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      }))

  return (
    <>
      <PageHeader title="Create Account" subtitle="Join TechNest BD today" />

      <section className="auth container">
        <div className="auth-card">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={update('name')}
              required
            />
            <label className="field-label" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              required
            />
            <label className="field-label" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={update('phone')}
              required
            />
            <label className="field-label" htmlFor="reg-pass">
              Password
            </label>
            <input
              id="reg-pass"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={update('password')}
              minLength={6}
              required
            />
            <label className="field-label" htmlFor="confirm">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={update('confirm')}
              required
            />
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={form.subscribed}
                onChange={update('subscribed')}
              />
              <span>
                Send me updates about deals and new arrivals via SMS/Email
              </span>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-accent block">
              Create Account
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </div>
      </section>
    </>
  )
}
