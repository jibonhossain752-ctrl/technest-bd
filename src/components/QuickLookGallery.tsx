'use client'

import { useEffect, useState } from 'react'
import { responsiveSrcset } from '@/lib/images'
import LightboxGallery from './LightboxGallery'

interface QuickLookGalleryProps {
  images: string[]
  /** Position-matched alt per image (built by src/lib/imageAlt.ts). */
  alts: string[]
  productName: string
  /** Emoji stand-in used when the product has no photo on file. */
  fallbackEmoji: string
  altFallback: string
  /**
   * Spec Score shown on the image badge — the share of this entry's spec fields
   * that are actually filled. It is a completeness indicator, not a rating, and
   * it is deliberately never emitted as schema.
   */
  specScore?: number
  /**
   * Image the variant selector picked, when the page has such a mapping. It
   * only moves the main image; the visitor's own thumbnail/arrow navigation
   * still wins afterwards. Absent on pages without variants or without a map,
   * which then behave exactly as before.
   */
  selectedImage?: string
}

/** Thumbnails shown inline before the "+N" tile takes over. */
const MAX_THUMBS = 3

/**
 * Gallery for a Quick Look page, ported from the source layout: ONE framed unit
 * holds the thumbnails and the main image, DOM order [thumbs, main], reversed on
 * small screens so the main image sits on top with a scrollable horizontal thumb
 * row beneath it. From 1024px the thumbs become a vertical rail on the LEFT of
 * the main image.
 *
 * Rendering rules:
 * - Up to MAX_THUMBS + 1 images: every thumbnail renders inline, no tile.
 * - More than that: the first MAX_THUMBS render inline and the last slot becomes
 *   a "+N" tile that opens the lightbox; the main image is click-to-zoom too.
 * - The Spec Score badge rides on the main image box.
 * - Prev/next arrows stay on the image box in both layouts.
 * - With no images the emoji stand-in renders alone, no controls.
 */
export default function QuickLookGallery({
  images,
  alts,
  productName,
  fallbackEmoji,
  altFallback,
  specScore,
  selectedImage,
}: QuickLookGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [active, setActive] = useState(0)

  // A variant choice moves the main image to its mapped render and lights the
  // matching thumbnail. Keyed on the selected image, so a visitor clicking a
  // thumbnail afterwards is not overridden.
  useEffect(() => {
    if (!selectedImage) return
    const position = images.indexOf(selectedImage)
    if (position >= 0) setActive(position)
  }, [selectedImage, images])

  if (images.length === 0) {
    return (
      <div className="ql-gallery">
        <span className="ql-gallery-emoji" role="img" aria-label={altFallback}>
          {fallbackEmoji}
        </span>
      </div>
    )
  }

  // More than MAX_THUMBS + 1 images (>4): 3 thumbs + the "+N" tile.
  // MAX_THUMBS + 1 or fewer (≤4): show them ALL inline, no tile.
  const showSeeAll = images.length > MAX_THUMBS + 1
  const inlineThumbs = showSeeAll ? images.slice(0, MAX_THUMBS) : images

  const activeIdx = active % images.length
  const current = images[activeIdx] ?? images[0]
  const currentAlt = alts[activeIdx] ?? alts[0] ?? altFallback

  const step = (delta: number) => setActive((value) => (value + delta + images.length) % images.length)

  return (
    <div className="ql-gallery">
      <div className="ql-gallery-shell">
        <div className="ql-gallery-rail">
          {inlineThumbs.map((image, position) => (
            <button
              key={image}
              type="button"
              className={position === activeIdx ? 'ql-gallery-thumb active' : 'ql-gallery-thumb'}
              onClick={() => setActive(position)}
              aria-label={`Show image ${position + 1} of ${images.length}`}
              aria-current={position === activeIdx}
            >
              {/* Decorative: the main image below carries the alt. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" width={80} height={80} loading="lazy" />
            </button>
          ))}

          {showSeeAll && (
            <button
              type="button"
              className={
                activeIdx >= MAX_THUMBS
                  ? 'ql-gallery-thumb ql-gallery-seeall active'
                  : 'ql-gallery-thumb ql-gallery-seeall'
              }
              onClick={() => setOpenIndex(activeIdx)}
              aria-label={`See all ${images.length} images`}
            >
              {/* Decorative: the tile is a control, and the count is the label. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[MAX_THUMBS]} alt="" width={80} height={80} loading="lazy" />
              <span className="ql-gallery-seeall-count">+{images.length - MAX_THUMBS}</span>
            </button>
          )}
        </div>

        <div className="ql-gallery-stage">
          {typeof specScore === 'number' && (
            <div className="ql-spec-score">
              <span className="ql-spec-score-label">Spec Score</span>
              <span className="ql-spec-score-value">{specScore}%</span>
            </div>
          )}

          <button
            type="button"
            className={showSeeAll ? 'ql-gallery-main zoomable' : 'ql-gallery-main'}
            onClick={showSeeAll ? () => setOpenIndex(activeIdx) : undefined}
            aria-label={`${currentAlt}${showSeeAll ? ' — open larger view' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current}
              src={current}
              srcSet={responsiveSrcset(current)}
              sizes="(max-width: 900px) 90vw, 520px"
              alt={currentAlt}
              width={640}
              height={640}
              fetchPriority="high"
            />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="ql-gallery-arrow left"
                onClick={() => step(-1)}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="ql-gallery-arrow right"
                onClick={() => step(1)}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {openIndex !== null && (
        <LightboxGallery
          images={images}
          alts={alts}
          ariaLabelBase={productName}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  )
}
