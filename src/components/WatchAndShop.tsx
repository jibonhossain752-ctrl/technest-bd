'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PLATFORM_PATHS, type PlatformKey } from '@/lib/socials'
import { VIDEOS } from '@/data/videos'
import CategoryScrollHint from './CategoryScrollHint'
import { track, pixelFor } from '@/lib/tracking'

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  instagram: 'IG',
  youtube: 'YT',
  facebook: 'FB',
  pinterest: 'PIN',
  tiktok: 'TT',
  whatsapp: 'WA',
}

export default function WatchAndShop() {
  const [isDesktop, setIsDesktop] = useState(false)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLAnchorElement
          if (!entry.isIntersecting || seen.has(el.dataset.videoId ?? '')) continue
          const videoId = el.dataset.videoId
          if (!videoId) continue
          seen.add(videoId)
          const platform = el.dataset.videoPlatform ?? ''
          track('video_card_impression', undefined, { video_id: videoId, platform })
        }
      },
      { rootMargin: '150px' },
    )
    cardRefs.current.forEach((el) => {
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <section className="watch-shop">
      <div className="container">
        <div className="section-head">
          <h2>Watch & Shop</h2>
          <p>Real reviews and hands-on demos — short videos, honest opinions</p>
        </div>
        <div className="watch-shop-wrap">
          <div className="watch-shop-strip" aria-label="Watch & Shop videos">
            {VIDEOS.map((v) => (
              <Link
                href={v.href}
                key={v.id}
                className="watch-card"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch ${v.title} on ${PLATFORM_LABEL[v.platform]}`}
                ref={(el) => {
                  cardRefs.current[VIDEOS.findIndex((x) => x.id === v.id)] = el
                }}
                data-video-id={v.id}
                data-video-platform={v.platform}
                onClick={() => {
                  track('video_card_click', undefined, {
                    video_id: v.id,
                    platform: v.platform,
                    title: v.title.slice(0, 200),
                  })
                  pixelFor('video_card_click', { platform: v.platform })
                }}
              >
                <div className={`watch-card-thumb thumb-${v.platform}`}>
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt={`${v.title} — video thumbnail`}
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
                  <h3>{v.title}</h3>
                  <p>Watch on {PLATFORM_LABEL[v.platform]} — opens in new tab</p>
                </div>
              </Link>
            ))}
          </div>
          <CategoryScrollHint
            targetSelector=".watch-shop-strip"
            clickable={isDesktop}
            direction="left"
            onArrowClick={(direction) =>
              track('video_scroll', undefined, { direction })
            }
          />
          <CategoryScrollHint
            targetSelector=".watch-shop-strip"
            clickable={isDesktop}
            direction="right"
            onArrowClick={(direction) =>
              track('video_scroll', undefined, { direction })
            }
          />
        </div>
      </div>
    </section>
  )
}
