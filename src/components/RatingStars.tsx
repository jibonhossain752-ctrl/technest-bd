import { RATING_SOURCE_LABEL } from '@/lib/site'

interface RatingStarsProps {
  rating: number | null
  /** Amazon's review count for the product. */
  reviews?: number
}

const STARS = [1, 2, 3, 4, 5]

/**
 * The star rating row: star strip, the rating number, then Amazon's review
 * count labelled as Amazon's — "4.2 (19,960 reviews in Amazon)". The wording
 * comes from `RATING_SOURCE_LABEL` in src/lib/site.ts so it changes in one
 * place; the singular reads "1 review in Amazon".
 *
 * Rules:
 * - A rating with no review count renders nothing. The row only exists to
 *   attribute Amazon's score, so without a count there is nothing to attribute
 *   — this covers `reviews: 0` and a missing count alike.
 * - The count always carries thousands separators.
 * - The label is part of the accessible name too, not only the visible text.
 */
export default function RatingStars({ rating, reviews }: RatingStarsProps) {
  if (rating == null || !reviews) return null

  const label =
    reviews === 1 ? RATING_SOURCE_LABEL.replace('reviews', 'review') : RATING_SOURCE_LABEL
  const count = reviews.toLocaleString('en-US')

  return (
    <span className="rating" aria-label={`Rated ${rating.toFixed(1)} out of 5, ${count} ${label}`}>
      <span className="rating-stars" aria-hidden="true">
        {STARS.map((star) => (
          <span
            key={star}
            className={star <= Math.round(rating) ? 'filled' : ''}
          >
            ★
          </span>
        ))}
      </span>
      <em>{rating.toFixed(1)}</em>
      <small>
        ({count} {label})
      </small>
    </span>
  )
}
