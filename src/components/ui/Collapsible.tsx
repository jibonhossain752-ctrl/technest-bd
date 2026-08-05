'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface CollapsibleProps {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export default function Collapsible({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`collapsible ${className ?? ''}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`collapsible-${title}`}
      >
        <span className="collapsible-title">
          {icon && (
            <span className="collapsible-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {title}
        </span>
        <span
          className={`collapsible-chevron ${open ? 'open' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      <div
        id={`collapsible-${title}`}
        className={`collapsible-body ${open ? 'open' : ''}`}
      >
        <div className="collapsible-content">{children}</div>
      </div>
    </div>
  )
}
