'use client'

import { useState } from 'react'
import { track, pixelFor } from '@/lib/tracking'

interface ShareButtonsProps {
  title: string
  slug: string
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

  const links = [
    {
      label: 'Facebook',
      aria: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'X',
      aria: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: 'LinkedIn',
      aria: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ]

  return (
    <div className="share-buttons">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={l.aria}
          className="share-btn"
          onClick={() => {
            const platform =
              l.label.toLowerCase() === 'x' ? 'x' : l.label.toLowerCase()
            track('share_click', undefined, { platform, post_slug: slug })
            pixelFor('share_click', { platform, post_slug: slug })
          }}
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        className="share-btn"
        onClick={handleCopy}
        aria-label="Copy link"
      >
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  )
}
