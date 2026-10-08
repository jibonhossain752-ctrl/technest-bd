import { VIDEOS, type VideoMeta, type VideoPlatform } from '@/data/videos'

/**
 * Reusable blog-post video helpers.
 *
 * A post opts in by setting `videoUrl` (plus optional `videoUploadDate`,
 * `videoTitle`, `videoDescription`) in src/data/posts.ts. When the URL is
 * missing or unrecognized, the blog template renders no card and emits no
 * VideoObject schema — no placeholders, no empty gaps.
 */

export interface ResolvedBlogVideo {
  /** Normalized URL (Instagram /reels/ is rewritten to /reel/). */
  url: string
  platform: VideoPlatform
  /** Short badge label matching the homepage cards (IG / YT / FB / PIN / TT). */
  platformLabel: string
  /** The matching homepage "Watch & Shop" card, when one exists. */
  homepageVideo?: VideoMeta
  /** Thumbnail reused from the homepage card data, when a match exists. */
  thumbnail: string | null
  /** Platform embed URL, where the platform has a straightforward one. */
  embedUrl: string | null
  videoId: string | null
}

const PLATFORM_LABELS: Record<VideoPlatform, string> = {
  instagram: 'IG',
  youtube: 'YT',
  facebook: 'FB',
  pinterest: 'PIN',
  tiktok: 'TT',
}

const PLATFORM_NAMES: Record<VideoPlatform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
}

export function detectVideoPlatform(url: string): VideoPlatform | null {
  const u = url.toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook'
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'pinterest'
  if (u.includes('tiktok.com')) return 'tiktok'
  return null
}

/** Normalize Instagram /reels/ URLs to the canonical /reel/ form. */
export function normalizeVideoUrl(url: string): string {
  return url.replace('/reels/', '/reel/')
}

export function platformName(platform: VideoPlatform): string {
  return PLATFORM_NAMES[platform]
}

/**
 * Resolve a post's videoUrl into everything the card and schema need.
 * Returns null when the platform cannot be detected (no card, no schema).
 */
export function resolveBlogVideo(rawUrl: string): ResolvedBlogVideo | null {
  const url = normalizeVideoUrl(rawUrl.trim())
  const platform = detectVideoPlatform(url)
  if (!platform) return null

  // Reuse the exact thumbnail from the homepage video data when the URL
  // matches a homepage card, so blog cards stay visually consistent.
  const homepageVideo = VIDEOS.find((v) => normalizeVideoUrl(v.href) === url)

  let videoId: string | null = null
  let embedUrl: string | null = null

  if (platform === 'tiktok') {
    videoId = url.match(/\/video\/(\d+)/)?.[1] ?? null
    embedUrl = videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null
  } else if (platform === 'youtube') {
    videoId =
      url.match(/(?:shorts\/|embed\/|watch\?v=|youtu\.be\/)([\w-]{6,})/)?.[1] ??
      null
    embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } else if (platform === 'instagram') {
    const kind = url.match(/\/(reel|p)\//)?.[1] ?? 'reel'
    videoId = url.match(/\/(?:reel|p)\/([\w-]+)/)?.[1] ?? null
    embedUrl = videoId
      ? `https://www.instagram.com/${kind}/${videoId}/embed`
      : null
  } else if (platform === 'facebook') {
    embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      url,
    )}&show_text=false`
  }
  // Pinterest has no simple iframe embed URL; its widget script is loaded
  // by the card component on click instead.

  return {
    url,
    platform,
    platformLabel: PLATFORM_LABELS[platform],
    homepageVideo,
    thumbnail: homepageVideo?.thumbnail ?? null,
    embedUrl,
    videoId,
  }
}
