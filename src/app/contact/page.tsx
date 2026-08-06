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
  { icon: '💬', title: 'WhatsApp', detail: '+880 1XXX-XXXXXX', note: 'Fastest response' },
  { icon: '✉️', title: 'Email', detail: 'support@technestbd.com', note: 'Replies within 24 hours' },
  { icon: '📍', title: 'Store Address', detail: 'Level 3, Tech Plaza, Elephant Road, Dhaka', note: 'Visit us in person' },
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
              {CHANNELS.map((channel) => (
                <div className="channel-card" key={channel.title}>
                  <span className="feature-icon">{channel.icon}</span>
                  <div>
                    <h4>{channel.title}</h4>
                    <p className="channel-detail">{channel.detail}</p>
                    <small>{channel.note}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="contact-socials" aria-label="Social media">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">IG</a>
              <a href="https://wa.me" target="_blank" rel="noreferrer" aria-label="WhatsApp">WA</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">YT</a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer" aria-label="Pinterest">P</a>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
