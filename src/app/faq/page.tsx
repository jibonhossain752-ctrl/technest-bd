'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FAQS, FAQ_CATEGORIES } from '@/data/faqs'
import PageHeader from '@/components/ui/PageHeader'

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(FAQS[0]?.id ?? null)
  const [category, setCategory] = useState('All')

  const filtered =
    category === 'All' ? FAQS : FAQS.filter((f) => f.category === category)

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Answers to the questions we hear most"
      />

      <section className="faq container">
        <div className="faq-filters">
          {['All', ...FAQ_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="faq-list">
          {filtered.map((faq) => (
            <div
              className={`faq-item ${open === faq.id ? 'open' : ''}`}
              key={faq.id}
            >
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                aria-expanded={open === faq.id}
              >
                <span>{faq.question}</span>
                <span className="faq-icon" aria-hidden="true">
                  {open === faq.id ? '−' : '+'}
                </span>
              </button>
              {open === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="empty-state faq-cta">
          <h3>Still have questions?</h3>
          <p>Our support team is happy to help you.</p>
          <Link href="/contact" className="btn btn-primary">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  )
}
