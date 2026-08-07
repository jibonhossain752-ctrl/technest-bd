'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLATFORM_PATHS, type PlatformKey } from '@/lib/socials'

interface Video {
  id: string
  fallbackTitle: string
  emoji: string
  platform: PlatformKey
  href: string
}

interface OEmbedData {
  title: string | null
  thumbnail: string | null
}

const VIDEOS: Video[] = [
  {
    id: 'v1',
    fallbackTitle: 'Instagram Reel',
    emoji: '📱',
    platform: 'instagram',
    href: 'https://www.instagram.com/reel/DbqkqRJCSXz/',
  },
  {
    id: 'v2',
    fallbackTitle: 'YouTube Short',
    emoji: '▶️',
    platform: 'youtube',
    href: 'https://www.youtube.com/shorts/svEfyu9bUCs',
  },
  {
    id: 'v3',
    fallbackTitle: 'Facebook Reel',
    emoji: '📸',
    platform: 'facebook',
    href: 'https://www.facebook.com/reel/1826212645426031',
  },
  {
    id: 'v4',
    fallbackTitle: 'Pinterest Pin',
    emoji: '📌',
    platform: 'pinterest',
    href: 'https://www.pinterest.com/pin/1051168369298012793/',
  },
  {
    id: 'v5',
    fallbackTitle: 'TikTok Video',
    emoji: '🎵',
    platform: 'tiktok',
    href: 'https://vm.tiktok.com/ZS4447xqV/',
  },
]

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  instagram: 'IG',
  youtube: 'YT',
  facebook: 'FB',
  pinterest: 'PIN',
  tiktok: 'TT',
  whatsapp: 'WA',
}

function fetchOEmbed(video: Video): Promise<OEmbedData> {
  return fetch(
    `/api/oembed?platform=${video.platform}&url=${encodeURIComponent(video.href)}`,
  )
    .then((r) => r.json())
    .then((data) => ({
      title: data.title ?? null,
      thumbnail: data.thumbnail ?? null,
    }))
    .catch((err) => {
      console.error(`[oembed] client fetch failed for ${video.platform}:`, err)
      return { title: null, thumbnail: null }
    })
}

export default function WatchAndShop() {
  const [meta, setMeta] = useState<Record<string, OEmbedData>>({})

  useEffect(() => {
    let cancelled = false
    VIDEOS.forEach((v) => {
      fetchOEmbed(v).then((data) => {
        if (!cancelled) setMeta((prev) => ({ ...prev, [v.id]: data }))
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="watch-shop">
      <div className="container">
        <div className="section-head">
          <h2>Watch & Shop</h2>
          <p>Real reviews and hands-on demos — short videos, honest opinions</p>
        </div>
        <div className="watch-shop-strip" aria-label="Watch & Shop videos">
          {VIDEOS.map((v) => {
            const info = meta[v.id]
            const title = info?.title ?? v.fallbackTitle
            return (
              <Link
                href={v.href}
                key={v.id}
                className="watch-card"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch ${title} on ${PLATFORM_LABEL[v.platform]}`}
              >
                <div className={`watch-card-thumb thumb-${v.platform}`}>
                  {info?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={info.thumbnail}
                      alt=""
                      className="watch-thumb-img"
                      loading="lazy"
                    />
                  ) : (
                    <>
                      <span className="watch-platform-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d={PLATFORM_PATHS[v.platform]} />
                        </svg>
                      </span>
                      <span className="watch-card-emoji" aria-hidden="true">
                        {v.emoji}
                      </span>
                    </>
                  )}
                  <span className="watch-platform-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d={PLATFORM_PATHS[v.platform]} />
                    </svg>
                    {PLATFORM_LABEL[v.platform]}
                  </span>
                  <span className="watch-play-btn" aria-hidden="true">
                    <span className="watch-play-icon">▶</span>
                  </span>
                </div>
                <div className="watch-card-body">
                  <h3>{title}</h3>
                  <p>
                    {info?.title
                      ? `Watch on ${PLATFORM_LABEL[v.platform]} — opens in new tab`
                      : `Watch on ${PLATFORM_LABEL[v.platform]}`}
                  </p>
                  <span className="watch-card-source">{PLATFORM_LABEL[v.platform]}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
