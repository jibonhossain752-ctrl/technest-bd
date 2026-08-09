'use client'

import { useState } from 'react'
import { track } from '@/lib/tracking'

interface PostFaqProps {
  faq: { question: string; answer: string }[]
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
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
