import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  crumbs?: { label: string; href?: string }[]
}

export default function PageHeader({ title, subtitle, crumbs = [] }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
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
        </nav>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  )
}