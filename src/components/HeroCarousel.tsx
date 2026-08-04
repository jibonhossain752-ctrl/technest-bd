'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  NEW_ARRIVALS_IDS,
  getProductById,
} from '@/data/products'
import type { Product } from '@/data/products'

const SLIDE_BG: string[] = [
  'linear-gradient(120deg, #0b1f3a, #1b3a63)',
  'linear-gradient(120deg, #0ea5e9, #2563eb)',
  'linear-gradient(120deg, #8b5cf6, #d946ef)',
]

interface HeroSlide {
  product: Product
  color: string
}

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const slides: HeroSlide[] = NEW_ARRIVALS_IDS.map((id) => getProductById(id)!)
    .filter((p) => Boolean(p))
    .map((product, i) => ({
      product,
      color: SLIDE_BG[i % SLIDE_BG.length],
    }))

  const goTo = (i: number) => {
    setIndex(((i % slides.length) + slides.length) % slides.length)
  }

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [paused, slides.length])

  return (
    <section
      className="hero"
      aria-label="New arrival promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container hero-inner">
        <div className="hero-track">
          {slides.map((slide, i) => {
            const { product, color } = slide
            return (
              <div
                key={product.id}
                className={`hero-slide ${i === index ? 'active' : ''}`}
                aria-hidden={i !== index}
              >
                <div className="hero-bg" style={{ background: color }} />
                <div className="hero-content">
                  <span className="badge">New Arrival</span>
                  <h1>
                    {product.name}
                    <br />
                    <span>{product.category}</span>
                  </h1>
                  <p>{product.description}</p>
                  <div className="hero-actions">
                    <Link href={`/product/${product.slug}`} className="btn btn-light">
                      Shop Now
                    </Link>
                    <Link href="/shop/new-arrivals" className="btn btn-ghost">
                      View All
                    </Link>
                  </div>
                </div>
                <div className="hero-emoji" aria-hidden="true">
                  {product.image}
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          className="hero-arrow prev"
          aria-label="Previous slide"
          onClick={() => goTo(index - 1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="hero-arrow next"
          aria-label="Next slide"
          onClick={() => goTo(index + 1)}
        >
          ›
        </button>

        <div className="hero-dots" aria-label="Slide navigation">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dot ${i === index ? 'active' : ''}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
