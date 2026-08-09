'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
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
      timer.current = setTimeout(() => setVisible(false), 3000)
    }
    previous.current = count
  }, [count])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <Link
      href="/cart"
      className={`toast ${visible ? 'show' : ''}`}
      role="status"
      aria-label="Added to cart. Go to cart."
    >
      Added to cart 🛒 — View cart
    </Link>
  )
}
