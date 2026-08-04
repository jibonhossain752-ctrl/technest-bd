interface Feature {
  icon: string
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  {
    icon: '🚚',
    title: 'Fast Delivery',
    desc: 'Nationwide delivery within 24-72 hours.',
  },
  {
    icon: '✅',
    title: 'Genuine Products',
    desc: '100% authentic, sourced from official distributors.',
  },
  {
    icon: '💬',
    title: '24/7 Support',
    desc: 'Our team is always here to help you.',
  },
  {
    icon: '🔁',
    title: 'Easy Return',
    desc: 'Hassle-free 7-day exchange and returns.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="why-us" id="why-us">
      <div className="container">
        <div className="section-head">
          <h2>Why Choose TechNest BD</h2>
          <p>We make shopping smarter, safer and faster</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div className="feature" key={feature.title}>
              <span className="feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
