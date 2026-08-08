'use client'

import { useEffect, useRef, useState } from 'react'

interface CategoryScrollHintProps {
  targetSelector?: string
  clickable?: boolean
  direction?: 'left' | 'right'
}

export default function CategoryScrollHint({
  targetSelector = '.category-chips',
  clickable = false,
  direction = 'right',
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
      const atStart = row.scrollLeft <= 4
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4
      const show = direction === 'left' ? canScroll && !atStart : canScroll && !atEnd
      setVisible(show)
      row.classList.toggle('scroll-end', !canScroll || atEnd)
      row.classList.toggle('scroll-start', !canScroll || atStart)
    }
    update()
    row.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      row.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [targetSelector, direction])

  const handleClick = () => {
    const row = rowRef.current
    if (!row) return
    const distance = row.clientWidth * 0.85 * (direction === 'left' ? -1 : 1)
    row.scrollBy({ left: distance, behavior: 'smooth' })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const cls = `cat-scroll-hint${visible ? ' visible' : ''}${clickable ? ' clickable' : ''} dir-${direction}`
  const icon = direction === 'left' ? '‹' : '›'
  const label =
    direction === 'left' ? 'Scroll videos to the left' : 'Scroll videos to the right'

  return (
    <span
      ref={hintRef}
      className={cls}
      aria-hidden={clickable ? undefined : 'true'}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? label : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKey : undefined}
    >
      <span className="cat-scroll-hint-icon">{icon}</span>
    </span>
  )
}
