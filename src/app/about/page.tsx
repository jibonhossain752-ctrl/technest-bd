import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about TechNest US — our story, mission, and why thousands of customers across the USA trust us for genuine tech with fast delivery.',
  alternates: { canonical: '/about' },
}

const VALUES = [
  {
    icon: '🎯',
    title: 'Our Mission',
    desc: 'To make genuine, high-quality tech products accessible and affordable for everyone in the USA.',
  },
  {
    icon: '🤝',
    title: 'Trust First',
    desc: 'We sell only 100% authentic products sourced from official distributors, backed by brand warranty.',
  },
  {
    icon: '🚀',
    title: 'Fast & Reliable',
    desc: 'With fast, reliable delivery across all 50 states, your orders reach you quickly and safely anywhere in the country.',
  },
  {
    icon: '💡',
    title: 'Honest Guidance',
    desc: 'Our team helps you choose the right product for your needs and budget — no pressure, just honest advice.',
  },
]

const STATS = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '10K+', label: 'Products Sold' },
  { value: '50', label: 'States Covered' },
  { value: '4.8/5', label: 'Average Rating' },
]

export default function AboutPage() {
  return (
    <>
      <section className="about-intro container">
        <div className="about-text">
          <h2>Who We Are</h2>
          <p>
            TechNest US started with a simple idea: shopping for technology in
            the United States should be easy, safe and affordable. Today, we are
            one of the country&apos;s most trusted online tech stores, serving
            thousands of customers across all 50 states.
          </p>
          <p>
            From laptops and smartphones to gaming gear and smart home devices,
            every product in our store is 100% genuine and sourced directly from
            official brand distributors. We back everything with official
            warranty and a 7-day return policy, so you can shop with complete
            confidence.
          </p>
        </div>
        <div className="about-stats">
          {STATS.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <div className="section-head">
            <h2>What Drives Us</h2>
            <p>The values behind everything we do</p>
          </div>
          <div className="values-grid">
            {VALUES.map((v) => (
              <div className="value-card" key={v.title}>
                <span className="feature-icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta container">
        <h2>Ready to upgrade your tech?</h2>
        <p>Browse thousands of genuine products at the best prices in the USA.</p>
        <Link href="/shop" className="btn btn-primary">
          Shop Now
        </Link>
      </section>
    </>
  )
}
