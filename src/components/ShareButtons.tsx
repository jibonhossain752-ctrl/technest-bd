'use client'

import { useState } from 'react'
import { track, pixelFor } from '@/lib/tracking'
import { PLATFORM_PATHS, SHARE_ICON_PATHS } from '@/lib/socials'

interface ShareButtonsProps {
  title: string
  slug: string
}

type ShareKey = 'facebook' | 'x' | 'linkedin' | 'copy'

interface ShareLink {
  key: Exclude<ShareKey, 'copy'>
  label: string
  href: string
  path: string
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const url = `https://gadgeterea.com/blog/${slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      track('share_click', undefined, { platform: 'copy', post_slug: slug })
      pixelFor('share_click', { platform: 'copy', post_slug: slug })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const links: ShareLink[] = [
    {
      key: 'facebook',
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      path: PLATFORM_PATHS.facebook,
    },
    {
      key: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      path: SHARE_ICON_PATHS.x,
    },
    {
      key: 'linkedin',
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      path: SHARE_ICON_PATHS.linkedin,
    },
  ]

  return (
    <div className="share-buttons">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          title={l.label}
          className="share-btn"
          onClick={() => {
            track('share_click', undefined, { platform: l.key, post_slug: slug })
            pixelFor('share_click', { platform: l.key, post_slug: slug })
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={l.path} />
          </svg>
        </a>
      ))}
      <button
        type="button"
        className="share-btn share-btn-copy"
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        title={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={SHARE_ICON_PATHS.check} />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={SHARE_ICON_PATHS.link} />
          </svg>
        )}
        <span
          className={`share-btn-toast${copied ? ' share-btn-toast--visible' : ''}`}
          role="status"
          aria-live="polite"
        >
          Copied!
        </span>
      </button>
    </div>
  )
}
