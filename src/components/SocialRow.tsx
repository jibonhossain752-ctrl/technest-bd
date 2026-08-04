const SOCIALS = [
  { label: 'f', name: 'Facebook', href: 'https://facebook.com' },
  { label: 'IG', name: 'Instagram', href: 'https://instagram.com' },
  { label: 'WA', name: 'WhatsApp', href: 'https://wa.me' },
  { label: 'YT', name: 'YouTube', href: 'https://youtube.com' },
  { label: 'P', name: 'Pinterest', href: 'https://pinterest.com' },
]

export default function SocialRow() {
  return (
    <div className="social-row" aria-label="Follow us on social media">
      {SOCIALS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={s.name}
          className="social-btn"
        >
          {s.label}
        </a>
      ))}
    </div>
  )
}
