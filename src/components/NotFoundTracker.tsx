'use client'

import { useEffect } from 'react'
import { track } from '@/lib/tracking'

/** Records 404 hits with the requested path and referrer (broken-link tracking). */
export default function NotFoundTracker() {
  useEffect(() => {
    track(
      '404_hit',
      window.location.pathname,
      { url: window.location.href.slice(0, 300), ref: document.referrer.slice(0, 300) },
      { force: true },
    )
  }, [])
  return null
}
