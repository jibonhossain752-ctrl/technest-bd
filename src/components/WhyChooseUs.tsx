interface Feature {
  icon: string
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  {
    icon: '⭐',
    title: 'Genuine Reviews',
    desc: 'Real, tested opinions from our team — never paid placements.',
  },
  {
    icon: '✅',
    title: 'Verified Deals',
    desc: 'Every price checked against the market before we publish it.',
  },
  {
    icon: '🚚',
    title: 'Fast Delivery',
    desc: 'Fast delivery across all 50 states.',
  },
  {
    icon: '💬',
    title: '24/7 Support',
    desc: 'Our team is always here to help you.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="why-us" id="why-us">
      <div className="container">
        <div className="section-head">
          <h2>Why Trust Us</h2>
          <p>Honest reviews, real deals and support that never sleeps</p>
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
