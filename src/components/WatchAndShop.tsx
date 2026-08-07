import Link from 'next/link'

type Platform = 'Instagram' | 'YouTube' | 'Facebook' | 'Pinterest' | 'TikTok'

interface Video {
  id: string
  title: string
  desc: string
  emoji: string
  platform: Platform
  href: string
}

const PLATFORM_BADGE: Record<Platform, string> = {
  Instagram: 'IG',
  YouTube: 'YT',
  Facebook: 'FB',
  Pinterest: 'PIN',
  TikTok: 'TT',
}

const VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'Instagram Reel',
    desc: 'Latest tech find — watch on Instagram',
    emoji: '📱',
    platform: 'Instagram',
    href: 'https://www.instagram.com/reel/DbqkqRJCSXz/',
  },
  {
    id: 'v2',
    title: 'YouTube Short',
    desc: 'Quick demo — watch on YouTube',
    emoji: '▶️',
    platform: 'YouTube',
    href: 'https://www.youtube.com/shorts/svEfyu9bUCs',
  },
  {
    id: 'v3',
    title: 'Facebook Reel',
    desc: 'Live demo — watch on Facebook',
    emoji: '📸',
    platform: 'Facebook',
    href: 'https://www.facebook.com/reel/1826212645426031',
  },
  {
    id: 'v4',
    title: 'Pinterest Pin',
    desc: 'Product gallery — view on Pinterest',
    emoji: '📌',
    platform: 'Pinterest',
    href: 'https://www.pinterest.com/pin/1051168369298012793/',
  },
  {
    id: 'v5',
    title: 'TikTok Video',
    desc: 'Short clip — watch on TikTok',
    emoji: '🎵',
    platform: 'TikTok',
    href: 'https://vm.tiktok.com/ZS4447xqV/',
  },
]

export default function WatchAndShop() {
  return (
    <section className="watch-shop">
      <div className="container">
        <div className="section-head">
          <h2>Watch & Shop</h2>
          <p>Real reviews and hands-on demos — short videos, honest opinions</p>
        </div>
        <div className="watch-shop-strip" aria-label="Watch & Shop videos">
          {VIDEOS.map((v) => (
            <Link
              href={v.href}
              key={v.id}
              className="watch-card"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${v.title} on ${v.platform}`}
            >
              <div className={`watch-card-thumb thumb-${v.platform.toLowerCase()}`}>
                <span className="watch-card-emoji" aria-hidden="true">
                  {v.emoji}
                </span>
                <span className="watch-platform-badge" aria-hidden="true">
                  {PLATFORM_BADGE[v.platform]}
                </span>
                <span className="watch-play-btn" aria-hidden="true">
                  <span className="watch-play-icon">▶</span>
                </span>
              </div>
              <div className="watch-card-body">
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
                <span className="watch-card-source">{v.platform}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
