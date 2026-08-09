'use client'

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { track, pixelFor } from '@/lib/tracking'

interface TrackedAffiliateLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick' | 'href'> {
  href: string
  children: ReactNode
  meta?: Record<string, unknown>
}

export default function TrackedAffiliateLink({
  href,
  children,
  meta,
  ...rest
}: TrackedAffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        track('affiliate_click', undefined, meta)
        pixelFor('affiliate_click', {
          product_slug: typeof meta?.product_slug === 'string' ? meta.product_slug : undefined,
        })
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
