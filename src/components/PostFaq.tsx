'use client'

import { useState } from 'react'
import { track } from '@/lib/tracking'

interface PostFaqProps {
  faq: {
    question: string
    answer: string
    /** Optional plain outbound link under the answer (a manufacturer's store). */
    link?: { href: string; label: string }
  }[]
  postSlug: string
}

export default function PostFaq({ faq, postSlug }: PostFaqProps) {
  const [open, setOpen] = useState<string | null>(faq[0]?.question ?? null)

  if (faq.length === 0) return null

  return (
    <div className="post-faq">
      <h2>Frequently Asked Questions</h2>
      {faq.map((item) => (
        <div
          className={`post-faq-item${open === item.question ? ' open' : ''}`}
          key={item.question}
        >
          <button
            type="button"
            className="post-faq-question"
            aria-expanded={open === item.question}
            onClick={() => {
              const next = open === item.question ? null : item.question
              setOpen(next)
              track('faq_expand', `/blog/${postSlug}`, {
                question: item.question.slice(0, 200),
                location: 'post',
                _dedupKey: 'q-' + item.question.slice(0, 200),
              })
            }}
          >
            <span>{item.question}</span>
            <span className="post-faq-icon" aria-hidden="true">
              {open === item.question ? '−' : '+'}
            </span>
          </button>
          {open === item.question && (
            <div className="post-faq-answer">
              <p>{item.answer}</p>
              {/* Optional plain outbound link. The FAQPage markup appends the
                  same label to the answer text, so the marked-up words still
                  match what a reader sees. */}
              {item.link && (
                <p>
                  <a href={item.link.href} target="_blank" rel="noopener">
                    {item.link.label}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
