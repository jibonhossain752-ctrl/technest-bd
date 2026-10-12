'use client'

import { useEffect, useState } from 'react'
import { PLATFORM_PATHS } from '@/lib/socials'
import { VIDEO_EMBED, platformName, resolveBlogVideo } from '@/lib/video'
import { VIDEO_POSTER_ALT, playButtonLabel } from '@/lib/imageAlt'

/**
 * Reusable, optional in-post video card.
 *
 * Render it for any post that sets `videoUrl`; it renders nothing when the
 * URL is missing or unrecognized, so posts without a video get no card, no
 * placeholder and no layout gap.
 *
 * Behavior:
 * - Looks like the homepage "Watch & Shop" cards (9:16 media box, title) for
 *   visual consistency, at the same 280px width.
 * - YouTube, Instagram, Pinterest and TikTok embed their official player
 *   directly with `loading="lazy"`, so the visitor presses the platform's own
 *   play button once — there is no poster in front of the player and no second
 *   click. The post's thumbnail still feeds the VideoObject `thumbnailUrl`; the
 *   card no longer shows it because the player draws its own poster frame.
 * - Facebook keeps the click-to-load poster (see `mode` in VIDEO_EMBED): its
 *   embed player asks for a Facebook session, so pressing play inside it leaves
 *   for facebook.com instead of playing here. The poster also keeps ~3 MB of
 *   Facebook player off a page view until the reader actually wants the video.
 * - A platform whose video cannot be resolved to an embed URL (for example a
 *   `pin.it` short link) falls back to the poster card, which opens the video
 *   on its platform instead of pretending it can play in place.
 * - Arrival autoplay: homepage cards link here as /blog/<slug>?play=1#video.
 *   On arrival the card is scrolled into view and, where the platform
 *   documents an autoplay parameter, the embed is asked to play muted (see
 *   VIDEO_EMBED in src/lib/video.ts). Readers who prefer reduced motion skip
 *   the smooth scroll, and a normal visit without ?play=1 shows the player
 *   paused.
 */
export default function BlogVideoCard({
  videoUrl,
  title,
  posterImage,
}: {
  videoUrl: string
  title: string
  /** Poster for a video that is not one of the homepage "Watch & Shop" cards. */
  posterImage?: string
}) {
  const video = resolveBlogVideo(videoUrl, posterImage)
  // True only for an arrival-autoplay load, so the embed can be asked to play.
  const [arrivalPlay, setArrivalPlay] = useState(false)
  // Set when the reader presses a click-to-load poster (see VIDEO_EMBED.mode).
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('play') !== '1') return
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    // Stop nudging once the reader takes the scroll over themselves.
    let readerTookOver = false
    const markIntent = () => {
      readerTookOver = true
    }
    const alignToCard = (smooth: boolean) => {
      if (readerTookOver) return
      // The link carries #video; this keeps the landing position clear of the
      // sticky site header even if the hash was not processed.
      document.getElementById('video')?.scrollIntoView({
        behavior: smooth && !reduceMotion ? 'smooth' : 'instant',
        block: 'start',
      })
    }
    window.addEventListener('wheel', markIntent, { passive: true })
    window.addEventListener('touchmove', markIntent, { passive: true })
    window.addEventListener('keydown', markIntent)
    alignToCard(true)
    // Images above the card can still finish loading after mount and push the
    // card off-screen, so re-align once the first layout has settled.
    const settle = window.setTimeout(() => alignToCard(false), 1200)
    setArrivalPlay(true)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('wheel', markIntent)
      window.removeEventListener('touchmove', markIntent)
      window.removeEventListener('keydown', markIntent)
    }
  }, [])

  if (!video) return null

  const embed = VIDEO_EMBED[video.platform]

  /**
   * Embed URL for the current state. Autoplay rides along only on an arrival
   * (?play=1) and only where the platform documents the parameter, so the
   * recorded `embedUrl` — which the VideoObject schema publishes — stays clean.
   */
  const embedSrc = (() => {
    if (!video.embedUrl) return null
    if (!arrivalPlay || !embed.autoplayParams) return video.embedUrl
    const separator = video.embedUrl.includes('?') ? '&' : '?'
    return `${video.embedUrl}${separator}${embed.autoplayParams}`
  })()

  // A direct platform shows its player at once; a click-to-load one waits.
  const showEmbed = Boolean(embedSrc) && (embed.mode === 'direct' || revealed)

  /** Analytics for an explicit play intent, fired from both card shapes. */
  const trackPlay = () => {
    import('@/lib/tracking')
      .then(({ track }) =>
        track('blog_video_play', undefined, {
          platform: video.platform,
          title: title.slice(0, 200),
        }),
      )
      .catch(() => {})
  }

  /** The reader asked for a click-to-load video: swap the poster for the player. */
  const play = () => {
    setRevealed(true)
    trackPlay()
  }

  /** Poster artwork, shared by the click-to-load button and the link-out card. */
  const posterArt = (
    <div className={`watch-card-thumb thumb-${video.platform}`}>
      {video.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail}
          alt={VIDEO_POSTER_ALT}
          className="watch-thumb-img"
          loading="lazy"
        />
      ) : (
        <span className="watch-platform-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={PLATFORM_PATHS[video.platform]} />
          </svg>
        </span>
      )}
      <span className="watch-platform-badge">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={PLATFORM_PATHS[video.platform]} />
        </svg>
        {video.platformLabel}
      </span>
      <span className="watch-play-btn" aria-hidden="true">
        <span className="watch-play-icon">▶</span>
      </span>
    </div>
  )

  const cardBody = (caption: string) => (
    <div className="watch-card-body">
      <h3>{title}</h3>
      <p>{caption}</p>
    </div>
  )

  return (
    <div className="blog-video-card" id="video">
      {showEmbed && embedSrc ? (
        /* Direct embed: the platform's own play button starts it in one click. */
        <div className="watch-card blog-video-watchcard">
          <div
            className={`watch-card-thumb blog-video-frame blog-video-frame-${embed.frame}`}
          >
            <iframe
              src={embedSrc}
              title={title}
              allow={embed.allow}
              allowFullScreen
              loading="lazy"
            />
          </div>
          {cardBody(
            embed.mode === 'direct'
              ? 'Press play — the video plays right here'
              : 'Tap to play — the video loads right here',
          )}
        </div>
      ) : video.embedUrl ? (
        /* Click-to-load: the player is not requested until the reader asks. */
        <button
          type="button"
          className="watch-card blog-video-watchcard"
          onClick={play}
          aria-label={playButtonLabel(title)}
        >
          {posterArt}
          {cardBody('Tap to play — the video loads right here')}
        </button>
      ) : (
        /* No resolvable embed URL, so the poster opens the video instead. */
        <a
          href={video.url}
          target="_blank"
          rel="noopener"
          className="watch-card blog-video-watchcard"
          aria-label={playButtonLabel(title)}
          onClick={trackPlay}
        >
          {posterArt}
          {cardBody(`Opens on ${platformName(video.platform)}`)}
        </a>
      )}
      <p className="blog-video-fallback">
        <a href={video.url} target="_blank" rel="noopener">
          Watch on {platformName(video.platform)}
        </a>
      </p>
    </div>
  )
}
