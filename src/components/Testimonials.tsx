'use client'

import { useEffect, useState } from 'react'

interface Testimonial {
  name: string
  city: string
  text: string
  rating: number
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Rakib Ahmed',
    city: 'Chittagong',
    text: 'Bought a laptop for my brother. Genuine product, sealed box, and delivered in just 2 days to Chittagong. Highly recommended!',
    rating: 5,
    initials: 'RA',
  },
  {
    name: 'Sadia Nahar',
    city: 'Dhaka',
    text: 'Best prices I could find online in BD. The warranty registration was super easy. TechNest is now my go-to store.',
    rating: 5,
    initials: 'SN',
  },
  {
    name: 'Mahir Islam',
    city: 'Sylhet',
    text: 'Fast delivery and great support team. They helped me choose the right gaming keyboard. 10/10 experience!',
    rating: 5,
    initials: 'MI',
  },
  {
    name: 'Tasnim Rahman',
    city: 'Rajshahi',
    text: 'Excellent service and genuine products. The cash on delivery option made me feel safe. Will shop again!',
    rating: 4,
    initials: 'TR',
  },
  {
    name: 'Nafis Hasan',
    city: 'Khulna',
    text: 'Ordered a PS5 and it arrived within 3 days, well packed. The team even called to confirm delivery. Great experience.',
    rating: 5,
    initials: 'NH',
  },
]

export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const perView = 3

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) =>
        current + perView >= TESTIMONIALS.length ? 0 : current + 1,
      )
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const visible = TESTIMONIALS.slice(index, index + perView)

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="section-head">
          <h2>What Our Customers Say</h2>
          <p>Trusted by thousands across Bangladesh</p>
        </div>
        <div className="testi-track">
          {visible.map((t) => (
            <div className="testi-card" key={t.name}>
              <div className="rating" aria-label={`${t.rating} stars`}>
                {'★'.repeat(t.rating)}
                {'☆'.repeat(5 - t.rating)}
              </div>
              <p>{t.text}</p>
              <div className="testi-user">
                <span className="avatar">{t.initials}</span>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.city}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="testi-scroll" aria-hidden="true">
          {TESTIMONIALS.map((t) => (
            <div className="testi-card" key={`scroll-${t.name}`}>
              <div className="rating" aria-label={`${t.rating} stars`}>
                {'★'.repeat(t.rating)}
                {'☆'.repeat(5 - t.rating)}
              </div>
              <p>{t.text}</p>
              <div className="testi-user">
                <span className="avatar">{t.initials}</span>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.city}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="testi-dots" aria-label="Testimonial navigation">
          {Array.from({ length: TESTIMONIALS.length - perView + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dot ${i === index ? 'active' : ''}`}
              aria-label={`Show testimonials ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
