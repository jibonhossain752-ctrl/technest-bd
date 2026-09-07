import Link from 'next/link'

export interface AuthorBioProps {
  name: string
  credibility?: string
  href?: string
}

const DEFAULT_HREF = '/about'

const STATIC_PROFILES: Record<string, Omit<AuthorBioProps, 'name'>> = {
  'Sam Carter': {
    credibility:
      'Tests gadgets hands-on for GadgetErea before they get recommended — especially audio gear, PC peripherals, and phone accessories.',
  },
  'Alex Morgan': {
    credibility:
      'Reviews home-office gear and creator tools for GadgetErea after running them through a typical workday or studio session.',
  },
  'Casey Nguyen': {
    credibility:
      'Covers everyday carry, smart home and travel gadgets for GadgetErea — focuses on what holds up after a month of real use.',
  },
  'Jordan Lee': {
    credibility:
      'Writes about flagship phones, foldables and gaming hardware for GadgetErea — buys the retail unit and uses it for two weeks before reviewing.',
  },
  'Riley Thompson': {
    credibility:
      'Tracks deal pricing and discount verification for GadgetErea — every "deal" in our catalog is checked against its 90-day average.',
  },
}

export default function AuthorBio({ name, credibility, href = DEFAULT_HREF }: AuthorBioProps) {
  const profile = STATIC_PROFILES[name]
  const statement = credibility || profile?.credibility || 'Contributor at GadgetErea.'
  return (
    <aside className="author-bio" aria-label={`About ${name}`}>
      <div className="author-bio-avatar" aria-hidden="true">
        {name.charAt(0)}
      </div>
      <div className="author-bio-body">
        <p className="author-bio-name">
          <span>Written by </span>
          <strong>{name}</strong>
        </p>
        <p className="author-bio-credibility">{statement}</p>
        <p className="author-bio-link">
          <Link href={href}>More about the GadgetErea team →</Link>
        </p>
      </div>
    </aside>
  )
}
