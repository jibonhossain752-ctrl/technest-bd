import type { Metadata } from 'next'
import PageHeader from '@/components/ui/PageHeader'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with TechNest BD — support, sales, warranty and partnership inquiries.',
}

const CHANNELS = [
  { icon: '📞', title: 'Phone', detail: '+880 1XXX-XXXXXX', note: 'Sat - Thu, 9AM - 9PM' },
  {
    icon: '💬',
    title: 'WhatsApp',
    detail: '+880 1XXX-XXXXXX',
    note: 'Fastest response',
    href: 'https://chat.whatsapp.com/G5i6PUKjtlX34htXhvnKHc?s=sh&p=a&ilr=0',
  },
  { icon: '✉️', title: 'Email', detail: 'support@technestbd.com', note: 'Replies within 24 hours' },
  { icon: '📍', title: 'Store Address', detail: 'Level 3, Tech Plaza, Elephant Road, Dhaka', note: 'Visit us in person' },
]

const CONTACT_SOCIALS = [
  { label: 'f', name: 'Facebook', href: 'https://www.facebook.com/amazonfindsgadget.shop' },
  { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com/amazonfindsgadget.shop/' },
  { label: 'WA', name: 'WhatsApp', href: 'https://chat.whatsapp.com/G5i6PUKjtlX34htXhvnKHc?s=sh&p=a&ilr=0' },
  { label: 'YT', name: 'YouTube', href: 'https://www.youtube.com/@amazonfindsgagdet' },
  { label: 'P', name: 'Pinterest', href: 'https://www.pinterest.com/amazonfinds_gadget/' },
]

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="We're here to help — reach out anytime"
        showHomeCrumb={false}
      />

      <section className="contact container">
        <div className="contact-layout">
          <ContactForm />

          <aside className="contact-info">
            <h3>Get in Touch</h3>
            <div className="contact-channels">
              {CHANNELS.map((channel) => {
                const card = (
                  <>
                    <span className="feature-icon">{channel.icon}</span>
                    <div>
                      <h4>{channel.title}</h4>
                      <p className="channel-detail">{channel.detail}</p>
                      <small>{channel.note}</small>
                    </div>
                  </>
                )
                return channel.href ? (
                  <a
                    className="channel-card"
                    key={channel.title}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {card}
                  </a>
                ) : (
                  <div className="channel-card" key={channel.title}>
                    {card}
                  </div>
                )
              })}
            </div>
            <div className="contact-socials" aria-label="Social media">
              {CONTACT_SOCIALS.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                  {s.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
