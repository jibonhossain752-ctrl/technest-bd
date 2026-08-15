'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { track, pixelFor } from '@/lib/tracking'

export default function NewsletterWidget() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = new FormData(e.currentTarget).get('email') as string
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input ?? '')
    setStatus(valid ? 'success' : 'error')
    if (valid) {
      e.currentTarget.reset()
      track('newsletter_subscribe', undefined, { location: 'widget' })
      pixelFor('newsletter_subscribe', { email: input })
    }
  }

  return (
    <div className="newsletter-widget">
      <h3>Get Weekly Gadget Deals 🔥</h3>
      <p>Join our newsletter for the best deals, straight to your inbox.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          onClick={() => track('newsletter_widget_subscribe_click')}
        >
          Subscribe
        </button>
      </form>
      {status === 'success' && (
        <p className="newsletter-msg success">Subscribed! 🎉</p>
      )}
      {status === 'error' && (
        <p className="newsletter-msg error">Please enter a valid email.</p>
      )}
    </div>
  )
}
