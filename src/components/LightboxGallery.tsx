'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { responsiveSrcset } from '@/lib/images'

interface LightboxGalleryProps {
  images: string[]
  /** Per-image alt, position-matched to `images` (built by src/lib/imageAlt.ts). */
  alts: string[]
  /** Plain-text base for the dialog's accessible name, e.g. the product name. */
  ariaLabelBase: string
  initialIndex: number
  onClose: () => void
}

/**
 * Product image lightbox — overlay, large view, click to zoom, arrow and
 * keyboard navigation (←/→/Esc), a single-row thumbnail strip and a close
 * button. Behaviours mirror the site's product galleries; styling uses only
 * the site's own custom properties (see the .ql-lightbox block in globals.css).
 *
 * Rendered in a PORTAL on document.body: the gallery sits inside `.ql-hero` and
 * the page's own stacking contexts, so in-tree it could only ever paint as high
 * as they allow. `.ql-lightbox` carries a z-index above the sticky site header
 * (1020) and the mobile bottom nav (1005); the portal removes the other half of
 * the problem, an ancestor context capping that z-index. Its size is expressed
 * in dvh with safe-area padding, so the counter line, the close button and the
 * thumbnails stay inside the visible viewport.
 */
export default function LightboxGallery({
  images,
  alts,
  ariaLabelBase,
  initialIndex,
  onClose,
}: LightboxGalleryProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(false)

  const total = images.length
  const prev = useCallback(() => setIndex((i) => (i + total - 1) % total), [total])
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') prev()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, prev, next])

  const current = images[index]
  if (!current) return null
  // The lightbox only opens from a click, but keep the server render harmless.
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="ql-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${ariaLabelBase} image gallery`}
      onClick={onClose}
    >
      <div className="ql-lightbox-panel" onClick={(event) => event.stopPropagation()}>
        <div className="ql-lightbox-head">
          <span className="ql-lightbox-count">
            {index + 1} / {total}
            <span className="ql-lightbox-hint">Click the image to zoom</span>
          </span>
          <button type="button" className="ql-lightbox-close" onClick={onClose} aria-label="Close gallery">
            ×
          </button>
        </div>

        <div className="ql-lightbox-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            srcSet={responsiveSrcset(current)}
            sizes="(max-width: 1024px) 100vw, 900px"
            alt={alts[index] ?? ''}
            className={zoom ? 'ql-lightbox-img zoomed' : 'ql-lightbox-img'}
            onClick={() => setZoom((value) => !value)}
          />
          {total > 1 && (
            <>
              <button type="button" className="ql-lightbox-arrow left" onClick={prev} aria-label="Previous image">
                ‹
              </button>
              <button type="button" className="ql-lightbox-arrow right" onClick={next} aria-label="Next image">
                ›
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="ql-lightbox-thumbs">
            {images.map((image, position) => (
              <button
                key={image}
                type="button"
                className={position === index ? 'ql-lightbox-thumb active' : 'ql-lightbox-thumb'}
                onClick={() => {
                  setIndex(position)
                  setZoom(false)
                }}
                aria-label={`View image ${position + 1}`}
                aria-current={position === index}
              >
                {/* Thumbnails repeat the main image, so they stay decorative. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" width={64} height={64} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
