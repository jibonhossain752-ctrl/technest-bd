'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getSession } from '@/lib/auth'
import { track, pixelFor } from '@/lib/tracking'

const SUBSCRIBED_KEY = 'technest-newsletter-subscribed'
const DELAY_MS = 30_000

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownRef = useRef(false)
  const interactedRef = useRef(false)

  const dismiss = useCallback(
    (method: string) => {
      interactedRef.current = true
      if (shownRef.current) {
        track('newsletter_popup_dismissed', undefined, { method })
      }
      setOpen(false)
    },
    [],
  )

  useEffect(() => {
    let suppress = false
    try {
      const subscribed = window.localStorage.getItem(SUBSCRIBED_KEY) === '1'
      const user = getSession()
      suppress = subscribed || user !== null
    } catch {
      suppress = true
    }
    if (suppress) return

    timerRef.current = setTimeout(() => {
      shownRef.current = true
      track('newsletter_popup_shown')
      setOpen(true)
    }, DELAY_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss('escape')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, dismiss])

  useEffect(() => {
    const onHide = () => {
      if (shownRef.current && !interactedRef.current) {
        track('newsletter_popup_no_interaction')
      }
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '')
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setStatus('error')
      return
    }
    interactedRef.current = true
    setStatus('success')
    track('newsletter_subscribe', undefined, { location: 'popup' })
    pixelFor('newsletter_subscribe', { email })
    try {
      window.localStorage.setItem(SUBSCRIBED_KEY, '1')
    } catch {
      /* storage unavailable */
    }
  }

  if (!open) return null

  return (
    <div className="newsletter-popup-overlay" onClick={() => dismiss('backdrop')}>
      <div
        className="newsletter-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Newsletter signup"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="newsletter-popup-close"
          onClick={() => dismiss('close-btn')}
          aria-label="Close"
        >
          ✕
        </button>
        <span className="newsletter-popup-emoji" aria-hidden="true">
          📬
        </span>
        <h2>Get Weekly Gadget Deals 🔥</h2>
        <p>
          Join our newsletter for the best deals, new arrivals and buying
          guides — straight to your inbox.
        </p>
        {status === 'success' ? (
          <p className="newsletter-msg success">Subscribed! 🎉</p>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-popup-form">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
            />
            <button
              type="submit"
              className="btn btn-accent"
              onClick={() => track('newsletter_popup_subscribe_click')}
            >
              Subscribe
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="newsletter-msg error">Please enter a valid email.</p>
        )}
        <button
          type="button"
          className="newsletter-popup-later"
          onClick={() => dismiss('no-thanks')}
        >
          No thanks — don&apos;t ask again this visit
        </button>
      </div>
    </div>
  )
}
