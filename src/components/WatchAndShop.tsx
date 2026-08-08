'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLATFORM_PATHS, type PlatformKey } from '@/lib/socials'
import { VIDEOS } from '@/data/videos'
import CategoryScrollHint from './CategoryScrollHint'

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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
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
          <CategoryScrollHint targetSelector=".watch-shop-strip" clickable={isDesktop} direction="left" />
          <CategoryScrollHint targetSelector=".watch-shop-strip" clickable={isDesktop} direction="right" />
        </div>
      </div>
    </section>
  )
}
