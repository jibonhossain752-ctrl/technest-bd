import Link from 'next/link'

interface Video {
  id: string
  title: string
  desc: string
  emoji: string
  source: 'Instagram' | 'Facebook'
  href: string
}

const VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'Top 5 Budget Smartphones',
    desc: 'Best picks under BDT 25,000',
    emoji: '📱',
    source: 'Instagram',
    href: 'https://instagram.com/technest.bd',
  },
  {
    id: 'v2',
    title: 'MacBook Air M2 First Look',
    desc: 'Is it worth the price?',
    emoji: '💻',
    source: 'Facebook',
    href: 'https://facebook.com/technestbd',
  },
  {
    id: 'v3',
    title: 'Best Gaming Gear Under BDT 30K',
    desc: 'Budget rig walkthrough',
    emoji: '🎮',
    source: 'Instagram',
    href: 'https://instagram.com/technest.bd',
  },
  {
    id: 'v4',
    title: 'Smart Home Tour 2026',
    desc: 'Full home setup reveal',
    emoji: '🏠',
    source: 'Facebook',
    href: 'https://facebook.com/technestbd',
  },
  {
    id: 'v5',
    title: 'iPhone Tips You Missed',
    desc: 'Hidden features exposed',
    emoji: '📱',
    source: 'Instagram',
    href: 'https://instagram.com/technest.bd',
  },
  {
    id: 'v6',
    title: 'Laptop Buying Guide',
    desc: "Don't waste your money",
    emoji: '💡',
    source: 'Facebook',
    href: 'https://facebook.com/technestbd',
  },
  {
    id: 'v7',
    title: 'Headphones Showdown',
    desc: 'Top 3 picks tested',
    emoji: '🎧',
    source: 'Instagram',
    href: 'https://instagram.com/technest.bd',
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
              rel="noreferrer"
              aria-label={`Watch ${v.title} on ${v.source}`}
            >
              <div className="watch-card-thumb">
                <span className="watch-card-emoji" aria-hidden="true">
                  {v.emoji}
                </span>
                <span className="watch-play-btn" aria-hidden="true">
                  <span className="watch-play-icon">▶</span>
                </span>
              </div>
              <div className="watch-card-body">
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
                <span className="watch-card-source">{v.source}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
