import type { ReactNode } from 'react'

interface PageIntroProps {
  /** The page's single H1. Text is unchanged by this component. */
  title: ReactNode
  /** Short description under the title — one sentence, 1–2 lines on desktop. */
  description?: ReactNode
}

/**
 * Shared page intro block: the page title and the short description under it.
 *
 * Both live in one wrapper (`.page-intro-inner`) that is exactly as wide as the
 * title, and the description (`.category-seo-intro`) fills that width without
 * being able to widen it — so every page gets the same left/right edges and the
 * same spacing, and a title that wraps on mobile takes the description with it.
 * The width rules live in globals.css next to `.category-seo-head`.
 */
export default function PageIntro({ title, description }: PageIntroProps) {
  return (
    <div className="page-intro-inner">
      <h1>{title}</h1>
      {description ? <p className="category-seo-intro">{description}</p> : null}
    </div>
  )
}
