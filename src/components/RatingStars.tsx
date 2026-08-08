interface RatingStarsProps {
  rating: number | null
  reviews?: number
}

const STARS = [1, 2, 3, 4, 5]

export default function RatingStars({ rating, reviews }: RatingStarsProps) {
  if (rating == null) return null

  return (
    <span className="rating" aria-label={`Rated ${rating} out of 5`}>
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
      {reviews !== undefined && reviews > 0 && <small>({reviews})</small>}
    </span>
  )
}
