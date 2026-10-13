'use client'

import { useState } from 'react'
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
}

/**
 * Main image plus thumbnail strip for a Quick Look page. Clicking the main
 * image opens the lightbox; with a single image the thumbnails and arrows are
 * skipped entirely rather than showing a control that does nothing.
 */
export default function QuickLookGallery({
  images,
  alts,
  productName,
  fallbackEmoji,
  altFallback,
}: QuickLookGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="ql-gallery">
        <span className="ql-gallery-emoji" role="img" aria-label={altFallback}>
          {fallbackEmoji}
        </span>
      </div>
    )
  }

  const current = images[active] ?? images[0]
  const currentAlt = alts[active] ?? alts[0] ?? altFallback

  return (
    <div className="ql-gallery">
      <button
        type="button"
        className="ql-gallery-main"
        onClick={() => setOpenIndex(active)}
        aria-label={`${currentAlt} — open larger view`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
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
        <div className="ql-gallery-thumbs">
          {images.map((image, position) => (
            <button
              key={image}
              type="button"
              className={position === active ? 'ql-gallery-thumb active' : 'ql-gallery-thumb'}
              onClick={() => setActive(position)}
              aria-label={`Show image ${position + 1} of ${images.length}`}
              aria-current={position === active}
            >
              {/* Decorative: the main image above already carries the alt. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" width={72} height={72} loading="lazy" />
            </button>
          ))}
        </div>
      )}

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
