'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { PLATFORM_PATHS } from '@/lib/socials'
import { platformName, resolveBlogVideo } from '@/lib/video'

/**
 * Reusable, optional in-post video card.
 *
 * Render it for any post that sets `videoUrl`; it renders nothing when the
 * URL is missing or unrecognized, so posts without a video get no card, no
 * placeholder and no layout gap.
 *
 * Behavior:
 * - Looks like the homepage "Watch & Shop" cards (platform badge, thumbnail,
 *   play button, title) for visual consistency.
 * - Clicking does NOT navigate away: it plays the video in place using the
 *   platform's official embed, loading the embed script lazily on first click.
 * - A small "Watch on [platform]" text link below the card is the fallback.
 * - The thumbnail is reused from the homepage video data when the URL matches
 *   a homepage card; otherwise a neutral fallback card is shown.
 * - Arrival autoplay: homepage cards link here as /blog/<slug>?play=1#video.
 *   On arrival the card is scrolled into view and the embed is mounted to play
 *   muted (YouTube/Facebook take autoplay+mute params; Instagram, TikTok and
 *   Pinterest mount their own player, which may wait for a tap). Readers who
 *   prefer reduced motion only get the scroll plus the visible play button,
 *   and a normal visit without ?play=1 keeps the click-to-load behavior.
 */
export default function BlogVideoCard({
  videoUrl,
  title,
}: {
  videoUrl: string
  title: string
}) {
  const video = resolveBlogVideo(videoUrl)
  const [playing, setPlaying] = useState(false)
  // True only for an arrival-autoplay load, so the embed can be asked to play.
  const [arrivalPlay, setArrivalPlay] = useState(false)

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
    if (!reduceMotion) {
      setPlaying(true)
      setArrivalPlay(true)
    }
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('wheel', markIntent)
      window.removeEventListener('touchmove', markIntent)
      window.removeEventListener('keydown', markIntent)
    }
  }, [])

  if (!video) return null

  /**
   * Embed URL for the current state. On arrival, YouTube and Facebook are
   * asked to autoplay muted; the other platforms decide for themselves, so
   * they keep their plain embed and show their own play control.
   */
  const embedSrc = (() => {
    if (!video.embedUrl) return null
    if (!arrivalPlay) return video.embedUrl
    if (video.platform === 'youtube')
      return `${video.embedUrl}?autoplay=1&mute=1`
    if (video.platform === 'facebook')
      return `${video.embedUrl}&autoplay=1&mute=1`
    return video.embedUrl
  })()

  const play = () => {
    setPlaying(true)
    import('@/lib/tracking')
      .then(({ track }) =>
        track('blog_video_play', undefined, {
          platform: video.platform,
          title: title.slice(0, 200),
        }),
      )
      .catch(() => {})
  }

  return (
    <div className="blog-video-card" id="video">
      {!playing ? (
        <button
          type="button"
          className="watch-card blog-video-watchcard"
          onClick={play}
          aria-label={`Play video: ${title}`}
        >
          <div className={`watch-card-thumb thumb-${video.platform}`}>
            {video.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnail}
                alt=""
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
          <div className="watch-card-body">
            <h3>{title}</h3>
            <p>Tap to play — the video loads right here</p>
          </div>
        </button>
      ) : (
        <div className="blog-video-embed">
          {video.platform === 'tiktok' && (
            <>
              <blockquote
                className="tiktok-embed"
                cite={video.url}
                data-video-id={video.videoId}
                style={{ maxWidth: '325px', minWidth: '288px' }}
              >
                <section>
                  <a target="_blank" rel="noopener" href={video.url}>
                    {title}
                  </a>
                </section>
              </blockquote>
              {/* TikTok's embed script converts the blockquote above into the
                  official in-place player. Loaded lazily, only after click. */}
              <Script
                src="https://www.tiktok.com/embed.js"
                strategy="afterInteractive"
              />
            </>
          )}
          {video.platform === 'youtube' && embedSrc && (
            <iframe
              src={embedSrc}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          )}
          {video.platform === 'instagram' && embedSrc && (
            <iframe src={embedSrc} title={title} loading="lazy" />
          )}
          {video.platform === 'facebook' && embedSrc && (
            <iframe
              src={embedSrc}
              title={title}
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          )}
          {video.platform === 'pinterest' && (
            <>
              <a
                data-pin-do="embedPin"
                href={video.url}
                target="_blank"
                rel="noopener"
              >
                {title}
              </a>
              <Script
                src="https://assets.pinterest.com/js/pinit.js"
                strategy="afterInteractive"
              />
            </>
          )}
        </div>
      )}
      <p className="blog-video-fallback">
        <a href={video.url} target="_blank" rel="noopener">
          Watch on {platformName(video.platform)}
        </a>
      </p>
    </div>
  )
}
