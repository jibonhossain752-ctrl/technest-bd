import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import SocialIcon from '@/components/SocialIcon'
import PageHeader from '@/components/ui/PageHeader'
import type { PlatformKey } from '@/lib/socials'

export const metadata: Metadata = {
  title: 'Contact GadgetErea – Support & Inquiries',
  description:
    'Contact GadgetErea for order support, warranty and partnership inquiries. Phone, WhatsApp, email and store in New York, USA. We reply within 24 hours.',
  alternates: { canonical: '/contact' },
  openGraph: {
    siteName: 'GadgetErea',
    type: 'website',
    url: 'https://gadgeterea.com/contact',
    title: 'Contact GadgetErea – Support & Inquiries',
    description:
      'Contact GadgetErea for order support, warranty and partnership inquiries. We reply within 24 hours.',
    images: [
      {
        url: '/images/blog/best-tech-gifts-under-50.jpg',
        width: 1200,
        height: 675,
        alt: 'GadgetErea - trending gadgets and the best Amazon finds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact GadgetErea – Support & Inquiries',
    description:
      'Contact GadgetErea for order support, warranty and partnership inquiries. We reply within 24 hours.',
    images: ['/images/blog/best-tech-gifts-under-50.jpg'],
  },
}

const CHANNELS = [
  { icon: '📞', title: 'Phone', detail: '(555) 010-1234', note: 'Mon - Fri, 9AM - 9PM' },
  {
    icon: '💬',
    title: 'WhatsApp',
    detail: '+1 (555) 010-1234',
    note: 'Fastest response',
    href: 'https://chat.whatsapp.com/G5i6PUKjtlX34htXhvnKHc?s=sh&p=a&ilr=0',
  },
  { icon: '✉️', title: 'Email', detail: 'support@technestus.com', note: 'Replies within 24 hours' },
  { icon: '📍', title: 'Store Address', detail: '1200 Tech Plaza, Suite 300, New York, NY 10001', note: 'Visit us in person' },
]

const CONTACT_SOCIALS: PlatformKey[] = ['facebook', 'instagram', 'whatsapp', 'youtube', 'pinterest']

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact GadgetErea"
        subtitle="Questions about an order, warranty or a gadget find? We reply within 24 hours."
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
              {CONTACT_SOCIALS.map((platform) => (
                <SocialIcon key={platform} platform={platform} />
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
