export type VideoPlatform =
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'pinterest'
  | 'tiktok'

export interface VideoMeta {
  id: string
  platform: VideoPlatform
  platformLabel: string
  title: string
  fallbackTitle: string
  emoji: string
  href: string
  thumbnail: string | null
  description: string
}

export const VIDEOS: VideoMeta[] = [
  {
    id: 'v1',
    platform: 'instagram',
    platformLabel: 'IG',
    title: 'This Iron Lifts Itself Automatically! | Eurosteam Step Up Steam Iron | Top US Pick 2026',
    fallbackTitle: 'Instagram Reel',
    emoji: '📱',
    href: 'https://www.instagram.com/reel/DbqkqRJCSXz/',
    thumbnail: '/images/videos/v1.webp',
    description:
      'Watch the Eurosteam Step Up steam iron lift itself automatically — a hands-on demo of our top US pick for 2026.',
  },
  {
    id: 'v2',
    platform: 'youtube',
    platformLabel: 'YT',
    title: 'Spider-Man vs Venom Begins! | PS5 DualSense Experience | Spider-Man: Brand New Day',
    fallbackTitle: 'YouTube Short',
    emoji: '▶️',
    href: 'https://www.youtube.com/shorts/svEfyu9bUCs',
    thumbnail: '/images/videos/v2.webp',
    description:
      'A hands-on PS5 DualSense experience from Spider-Man: Brand New Day — feel the fight in every vibration.',
  },
  {
    id: 'v3',
    platform: 'facebook',
    platformLabel: 'FB',
    title: 'Stop Overcharging Forever! | 140W Smart Auto Stop USB-C Fast Charger | Top US Pick 2026',
    fallbackTitle: 'Facebook Reel',
    emoji: '📸',
    href: 'https://www.facebook.com/reel/1826212645426031',
    thumbnail: '/images/videos/v3.webp',
    description:
      'The 140W Smart Auto Stop USB-C fast charger stops charging automatically — no more overcharging overnight.',
  },
  {
    id: 'v4',
    platform: 'pinterest',
    platformLabel: 'PIN',
    title: 'Stay Cool for 36 Hours! | Omni PRO Dynamic Ergonomic Office Chair | Top US Pick 2026',
    fallbackTitle: 'Pinterest Pin',
    emoji: '📌',
    href: 'https://www.pinterest.com/pin/1051168369298012793/',
    thumbnail: '/images/videos/v4.webp',
    description:
      'Why the Omni PRO dynamic ergonomic office chair keeps you cool and comfortable for 36-hour work sessions.',
  },
  {
    id: 'v5',
    platform: 'tiktok',
    platformLabel: 'TT',
    title: 'The Future Is on Your Face! | Even Realities G2 AI Smart Glasses | Top US Pick 2026',
    fallbackTitle: 'TikTok Video',
    emoji: '🎵',
    href: 'https://www.tiktok.com/@amazonfindsgadget.shop/video/7662305439891180821',
    thumbnail: '/images/videos/v5.webp',
    description:
      'A first look at the Even Realities G2 AI smart glasses — see why they are our top wearable pick for 2026.',
  },
]
