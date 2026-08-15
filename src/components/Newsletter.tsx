'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { track, pixelFor } from '@/lib/tracking'

export default function Newsletter() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = new FormData(e.currentTarget).get('email') as string
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input ?? '')
    setStatus(valid ? 'success' : 'error')
    if (valid) {
      e.currentTarget.reset()
      track('newsletter_subscribe', undefined, { location: 'section' })
      pixelFor('newsletter_subscribe', { email: input })
    }
  }

  return (
    <section className="newsletter">
      <div className="container newsletter-card">
        <h2>Get Weekly Gadget Deals 🔥</h2>
        <p>Subscribe for exclusive deals, new arrivals and tech tips.</p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            className="btn btn-accent"
            onClick={() => track('newsletter_section_subscribe_click')}
          >
            Subscribe
          </button>
        </form>
        <small className="newsletter-note">
          We respect your privacy. Unsubscribe anytime.
        </small>
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
