'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

export default function ContactForm() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
    e.currentTarget.reset()
  }

  return (
    <div className="contact-form-wrap">
      <h2>Send Us a Message</h2>
      <p>Fill out the form and our team will get back to you shortly.</p>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
        </div>
        <input type="text" placeholder="Subject" required />
        <textarea placeholder="Your message..." rows={5} required />
        {sent && <p className="newsletter-msg success">Thanks! We&apos;ll get back to you soon. 📩</p>}
        <button type="submit" className="btn btn-primary">
          Send Message
        </button>
      </form>
    </div>
  )
}
