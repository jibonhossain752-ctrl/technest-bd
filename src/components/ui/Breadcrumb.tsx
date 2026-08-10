import Link from 'next/link'

interface BreadcrumbProps {
  crumbs: { label: string; href?: string }[]
}

const SITE = 'https://gadgeterea.com'

export default function Breadcrumb({ crumbs }: BreadcrumbProps) {
  const items = [
    { label: 'Home', href: '/' },
    ...crumbs,
  ]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
    </>
  )
}
