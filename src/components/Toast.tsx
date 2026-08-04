'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/context/useCart'

export default function Toast() {
  const { count } = useCart()
  const [visible, setVisible] = useState(false)
  const previous = useRef(count)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (count > previous.current) {
      setVisible(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(false), 2000)
    }
    previous.current = count
  }, [count])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <div className={`toast ${visible ? 'show' : ''}`} role="status">
      Added to cart 🛒
    </div>
  )
}
