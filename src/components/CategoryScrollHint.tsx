'use client'

import { useEffect, useRef, useState } from 'react'

interface CategoryScrollHintProps {
  targetSelector?: string
}

export default function CategoryScrollHint({
  targetSelector = '.category-chips',
}: CategoryScrollHintProps) {
  const hintRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const holder = hintRef.current?.parentElement
    const row = holder?.querySelector(targetSelector) as HTMLElement | null
    if (!row) return
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

  return (
    <span
      ref={hintRef}
      className={`cat-scroll-hint${visible ? ' visible' : ''}`}
      aria-hidden="true"
    >
      <span className="cat-scroll-hint-icon">›</span>
    </span>
  )
}
