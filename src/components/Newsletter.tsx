'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

export default function Newsletter() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = new FormData(e.currentTarget).get('email') as string
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input ?? '')
    setStatus(valid ? 'success' : 'error')
    if (valid) e.currentTarget.reset()
  }

  return (
    <section className="newsletter">
      <div className="container newsletter-card">
        <h2>Stay Updated</h2>
        <p>Subscribe for exclusive deals, new arrivals and tech tips.</p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          />
          <button type="submit" className="btn btn-primary">
            Subscribe
          </button>
        </form>
        {status === 'success' && (
          <p className="newsletter-msg success">
            Thanks for subscribing! Stay tuned for deals. 🎉
          </p>
        )}
        {status === 'error' && (
          <p className="newsletter-msg error">Please enter a valid email.</p>
        )}
      </div>
    </section>
  )
}
