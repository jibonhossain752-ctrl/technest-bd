'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/tracking'

export default function AnalyticsBootstrap() {
  useEffect(() => {
    initAnalytics()
  }, [])
  return null
}
