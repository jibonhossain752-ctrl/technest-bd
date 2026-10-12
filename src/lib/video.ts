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
 * Per-platform embed facts for the in-post video card.
 *
 * Every parameter here is documented by the platform itself — nothing is
 * guessed:
 *
 * - YouTube: `autoplay` and `mute`. Mute rides along because browsers block
 *   unmuted autoplay.
 * - TikTok player v1: `autoplay` (its parameter table lists `autoplay` and
 *   `muted`; `muted` is deliberately not used because it locks the volume
 *   control off for the rest of the session).
 * - Facebook video plugin: `autoplay`. Its documentation states autoplay
 *   "will be played without sound (muted)" and lists no `mute` parameter, so
 *   none is added.
 * - Instagram and Pinterest document no autoplay parameter at all, so those
 *   embeds only ever start on a click.
 *
 * `frame: 'chrome'` marks a player that draws its own header/footer around the
 * video (Instagram's profile row and action bar, Facebook's page row), so the
 * card gives it a taller box instead of clipping the chrome away.
 *
 * `mode: 'click-to-load'` keeps the poster in front of the player until the
 * reader asks for it. Facebook is the one platform that needs it: its embedded
 * player wants a Facebook session, so pressing play inside the embed navigates
 * to facebook.com instead of playing in the page. The poster is what the card
 * had before the direct-embed change, and it keeps Facebook's several-megabyte
 * player off a page view entirely.
 */
export interface VideoEmbedConfig {
  /** iframe `allow` attribute. */
  allow: string
  /** Autoplay query string, or null when the platform documents none. */
  autoplayParams: string | null
  frame: 'media' | 'chrome'
  mode: 'direct' | 'click-to-load'
}

export const VIDEO_EMBED: Record<VideoPlatform, VideoEmbedConfig> = {
  youtube: {
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    autoplayParams: 'autoplay=1&mute=1',
    frame: 'media',
    mode: 'direct',
  },
  tiktok: {
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    autoplayParams: 'autoplay=1',
    frame: 'media',
    mode: 'direct',
  },
  pinterest: {
    allow: 'encrypted-media; picture-in-picture; fullscreen',
    autoplayParams: null,
    frame: 'media',
    mode: 'direct',
  },
  instagram: {
    allow: 'encrypted-media; picture-in-picture; fullscreen',
    autoplayParams: null,
    frame: 'chrome',
    mode: 'direct',
  },
  facebook: {
    allow:
      'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen',
    autoplayParams: 'autoplay=true',
    frame: 'chrome',
    mode: 'click-to-load',
  },
}

/**
 * Resolve a post's videoUrl into everything the card and schema need.
 * Returns null when the platform cannot be detected (no card, no schema).
 *
 * `overrideThumbnail` is the poster for a post whose video is not one of the
 * homepage "Watch & Shop" cards (see `videoThumbnail` in src/data/posts.ts);
 * a matching homepage card still wins so those cards stay consistent.
 */
/**
 * The real UTC upload time when the platform's own id encodes one.
 *
 * A TikTok video id carries its creation time in its high 32 bits (Unix
 * seconds, UTC), so those posts can state a genuine time of day instead of a
 * bare date. No other platform we embed does — a YouTube id is random, an
 * Instagram shortcode does not decode to the recorded date, and Facebook /
 * Pinterest expose nothing — so this returns null rather than a guess.
 */
function platformUploadTime(video: ResolvedBlogVideo): string | null {
  if (video.platform !== 'tiktok' || !video.videoId) return null
  if (!/^\d{15,25}$/.test(video.videoId)) return null
  const seconds = BigInt(video.videoId) / 4294967296n
  const date = new Date(Number(seconds) * 1000)
  if (Number.isNaN(date.getTime())) return null
  // Whole seconds are all the id carries; drop the `.000` milliseconds.
  return date.toISOString().replace('.000Z', 'Z')
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const WITH_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?/
const WITH_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/

/**
 * Normalize a post's `videoUploadDate` for the VideoObject `uploadDate`.
 *
 * Google's video validation wants a timezone: a bare `YYYY-MM-DD` is reported
 * as "missing a timezone", and a datetime without an offset is ambiguous.
 * So:
 *
 * - `YYYY-MM-DD`                         → unchanged
 * - `<date>T<time>Z` or `<date>T<time>±HH:MM` → unchanged
 * - `<date>T<time>` with no offset       → the date alone
 * - anything else                        → unchanged, with a warning
 *
 * Exception: when the platform id proves the real upload time and it lands on
 * the same calendar day as the recorded date, that timestamp is used — a
 * verified offset beats a bare date. A time we cannot prove is never invented.
 */
export function resolveVideoUploadDate(
  video: ResolvedBlogVideo,
  rawUploadDate: string,
): string {
  const value = rawUploadDate.trim()
  if (!WITH_TIME.test(value)) {
    if (!DATE_ONLY.test(value)) {
      console.warn(
        `[video] ${video.url}: unrecognized uploadDate "${value}" — expected YYYY-MM-DD or an ISO 8601 datetime. Left as-is.`,
      )
      return value
    }
    const verified = platformUploadTime(video)
    if (!verified) return value
    if (verified.slice(0, 10) === value) return verified
    console.warn(
      `[video] ${video.url}: recorded uploadDate "${value}" disagrees with the platform id (${verified}) — keeping the recorded date.`,
    )
    return value
  }

  if (WITH_ZONE.test(value)) return value

  // A time of day without an offset cannot be placed on a clock, so keep only
  // the part we actually know.
  const date = value.slice(0, 10)
  console.warn(
    `[video] ${video.url}: uploadDate "${value}" has a time but no timezone; emitting the date only (${date}).`,
  )
  return date
}

export function resolveBlogVideo(
  rawUrl: string,
  overrideThumbnail?: string | null,
): ResolvedBlogVideo | null {
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
    // The v1 player is TikTok's current official embed. The older blockquote +
    // embed.js route builds the same thing but rate-limits hard, so the card
    // never loads that script.
    embedUrl = videoId ? `https://www.tiktok.com/player/v1/${videoId}` : null
  } else if (platform === 'youtube') {
    videoId =
      url.match(/(?:shorts\/|embed\/|watch\?v=|youtu\.be\/)([\w-]{6,})/)?.[1] ??
      null
    // `rel=0` keeps related videos to the same channel and `playsinline=1`
    // stops iOS Safari from hijacking the card into a fullscreen player. The
    // card appends its own autoplay/mute params on top of this base URL, and
    // the VideoObject `embedUrl` is this value verbatim (no extra params).
    embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1`
      : null
  } else if (platform === 'instagram') {
    const kind = url.match(/\/(reel|p)\//)?.[1] ?? 'reel'
    videoId = url.match(/\/(?:reel|p)\/([\w-]+)/)?.[1] ?? null
    embedUrl = videoId
      ? `https://www.instagram.com/${kind}/${videoId}/embed/`
      : null
  } else if (platform === 'facebook') {
    embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      url,
    )}&show_text=false`
  } else if (platform === 'pinterest') {
    videoId = url.match(/\/pin\/(\d+)/)?.[1] ?? null
    // The same iframe Pinterest's own pinit.js widget injects, so the pin
    // plays in place without loading their widget script. `pin.it` short
    // links carry no id, so those keep the click-to-load card.
    embedUrl = videoId
      ? `https://assets.pinterest.com/ext/embed.html?id=${videoId}`
      : null
  }

  return {
    url,
    platform,
    platformLabel: PLATFORM_LABELS[platform],
    homepageVideo,
    thumbnail: homepageVideo?.thumbnail ?? overrideThumbnail ?? null,
    embedUrl,
    videoId,
  }
}
