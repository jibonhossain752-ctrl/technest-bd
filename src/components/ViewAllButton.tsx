import Link from 'next/link'

interface ViewAllButtonProps {
  href: string
  label: string
}

/**
 * Shared centred "View all …" link that sits directly below a section's card
 * grid or row. A real crawlable <a> with visible text — never nofollow, and
 * never a button that only runs JavaScript.
 *
 * Styling reuses the site's own .btn tokens so it matches the rest of the store;
 * the wrapper class only handles centring and the gap below the grid.
 */
export default function ViewAllButton({ href, label }: ViewAllButtonProps) {
  return (
    <div className="view-all-wrap">
      <Link href={href} className="btn btn-primary">
        {label}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
