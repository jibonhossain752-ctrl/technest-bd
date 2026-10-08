'use client'

import { useState } from 'react'
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

  if (!video) return null

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
    <div className="blog-video-card">
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
          {video.platform === 'youtube' && video.embedUrl && (
            <iframe
              src={video.embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          )}
          {video.platform === 'instagram' && video.embedUrl && (
            <iframe src={video.embedUrl} title={title} loading="lazy" />
          )}
          {video.platform === 'facebook' && video.embedUrl && (
            <iframe
              src={video.embedUrl}
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
