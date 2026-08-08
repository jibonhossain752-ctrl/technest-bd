import Link from 'next/link'

interface BreadcrumbProps {
  crumbs: { label: string; href?: string }[]
}

export default function Breadcrumb({ crumbs }: BreadcrumbProps) {
  return (
    <nav className="page-breadcrumb" aria-label="Breadcrumb">
      <div className="container">
        <Link href="/">Home</Link>
        {crumbs.map((crumb, i) => (
          <span key={i}>
            <span className="crumb-sep">/</span>
            {crumb.href ? (
              <Link href={crumb.href}>{crumb.label}</Link>
            ) : (
              <span className="crumb-current">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  )
}
