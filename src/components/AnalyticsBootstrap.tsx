'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, onRouteChange } from '@/lib/tracking'

export default function AnalyticsBootstrap() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    onRouteChange(pathname)
  }, [pathname])

  return null
}