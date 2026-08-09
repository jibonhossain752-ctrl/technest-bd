'use client'

import { useCallback, useEffect, useRef } from 'react'
import { PLATFORMS, PLATFORM_PATHS, type PlatformKey } from '@/lib/socials'
import { track } from '@/lib/tracking'

const FALLBACK_MS = 1800

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

interface SocialIconProps {
  platform: PlatformKey
  className?: string
  ariaLabel?: string
  trackLocation?: string
}

export default function SocialIcon({
  platform,
  className,
  ariaLabel,
  trackLocation = 'unknown',
}: SocialIconProps) {
  const config = PLATFORMS[platform]
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
    }
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      track('social_link_click', undefined, {
        platform,
        location: trackLocation,
      })
      if (!isMobileDevice() || !config.scheme) return
      e.preventDefault()
      let opened = false
      fallbackTimer.current = setTimeout(() => {
        if (!opened) window.location.href = config.web
      }, FALLBACK_MS)
      const cancel = () => {
        opened = true
        if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
      }
      window.addEventListener('pagehide', cancel)
      document.addEventListener('visibilitychange', onVisibility)
      function onVisibility() {
        if (document.hidden) cancel()
      }
      if (isIOS()) {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = config.scheme
        document.body.appendChild(iframe)
        setTimeout(() => iframe.remove(), 3000)
      } else {
        window.location.href = config.scheme
      }
    },
    [config, platform, trackLocation],
  )

  return (
    <a
      href={config.web}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? config.name}
      className={className}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={PLATFORM_PATHS[platform]} />
      </svg>
    </a>
  )
}
