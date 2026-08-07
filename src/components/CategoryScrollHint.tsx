'use client'

import { useEffect, useRef, useState } from 'react'

interface CategoryScrollHintProps {
  targetSelector?: string
  clickable?: boolean
}

export default function CategoryScrollHint({
  targetSelector = '.category-chips',
  clickable = false,
}: CategoryScrollHintProps) {
  const hintRef = useRef<HTMLSpanElement>(null)
  const rowRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const holder = hintRef.current?.parentElement
    const row = holder?.querySelector(targetSelector) as HTMLElement | null
    if (!row) return
    rowRef.current = row
    const update = () => {
      const canScroll = row.scrollWidth > row.clientWidth + 4
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4
      setVisible(canScroll && !atEnd)
      row.classList.toggle('scroll-end', !canScroll || atEnd)
    }
    update()
    row.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      row.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [targetSelector])

  const handleClick = () => {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: row.clientWidth * 0.85, behavior: 'smooth' })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <span
      ref={hintRef}
      className={`cat-scroll-hint${visible ? ' visible' : ''}${clickable ? ' clickable' : ''}`}
      aria-hidden={clickable ? undefined : 'true'}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? 'Scroll videos to the right' : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKey : undefined}
    >
      <span className="cat-scroll-hint-icon">›</span>
    </span>
  )
}
