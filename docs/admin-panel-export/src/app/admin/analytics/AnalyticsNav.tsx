import Link from 'next/link'

const ITEMS = [
  { key: 'overview', href: '/admin/analytics', label: 'Overview' },
  { key: 'devices', href: '/admin/analytics/devices', label: 'Devices' },
  { key: 'locations', href: '/admin/analytics/locations', label: 'Locations' },
  { key: 'search', href: '/admin/analytics/search', label: 'Search & FAQ' },
  {
    key: 'search-console',
    href: '/admin/analytics/search-console',
    label: 'Search Console',
  },
] as const

export type AnalyticsTab = (typeof ITEMS)[number]['key']

export default function AnalyticsNav({ active }: { active: AnalyticsTab }) {
  return (
    <nav className="an-subnav" aria-label="Analytics sections">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`an-subnav-tab${active === item.key ? ' active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
