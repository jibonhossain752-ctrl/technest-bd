'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      subject: String(data.get('subject') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
    }

    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.')
      setStatus('sent')
      form.reset()
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof Error
          ? err.message
          : 'Could not send your message. Please try again.',
      )
    }
  }

  return (
    <div className="contact-form-wrap">
      <h2>Send Us a Message</h2>
      <p>Fill out the form and our team will get back to you shortly.</p>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input type="text" name="name" placeholder="Your Name" required />
          <input type="email" name="email" placeholder="Your Email" required />
        </div>
        <input type="text" name="subject" placeholder="Subject" required />
        <textarea
          name="message"
          placeholder="Your message..."
          rows={5}
          required
        />
        {status === 'sent' && (
          <p className="newsletter-msg success">
            Thanks! We&apos;ll get back to you soon. 📩
          </p>
        )}
        {status === 'error' && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
