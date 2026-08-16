'use client'

import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { getSession } from '@/lib/auth'

const SUBSCRIBED_KEY = 'technest-newsletter-subscribed'
const DELAY_MS = 30_000

export default function NewsletterPopupLazy() {
  const [Comp, setComp] = useState<ComponentType | null>(null)

  useEffect(() => {
    let suppress = false
    try {
      suppress =
        window.localStorage.getItem(SUBSCRIBED_KEY) === '1' ||
        getSession() !== null
    } catch {
      suppress = true
    }
    if (suppress) return

    const timer = setTimeout(async () => {
      const mod = await import('./NewsletterPopup')
      setComp(() => mod.default)
    }, DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return Comp ? <Comp /> : null
}