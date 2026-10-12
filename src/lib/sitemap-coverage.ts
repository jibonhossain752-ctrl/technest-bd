import fs from 'node:fs'
import path from 'node:path'

import {
  DYNAMIC_ROUTE_SOURCES,
  getExcludedPublicPaths,
  getSitemapEntries,
} from './sitemap-routes'

/**
 * Build-time guard against sitemap drift.
 *
 * `assertSitemapCoverage()` runs whenever the sitemap is generated (i.e. on
 * `next build`), and throws if:
 *   - a page that exists under `src/app` is missing from the sitemap,
 *   - the sitemap lists a URL no built page serves,
 *   - a private/utility route leaks into the sitemap,
 *   - an entry repeats, carries a query string, or has a future date.
 */

/** Never listed in the sitemap — bots must not be sent here. */
const PRIVATE_PAGE_PATHS = ['/cart', '/checkout', '/account', '/login', '/register', '/admin']
const PRIVATE_ROUTE_PREFIXES = ['/admin/', '/api/']

interface AppRoute {
  /** Route path, `[param]` segments included. */
  path: string
  kind: 'page' | 'route'
}

export interface SitemapAudit {
  problems: string[]
  warnings: string[]
  indexed: string[]
  excluded: { path: string; reason: string }[]
}

const isPrivate = (routePath: string): boolean =>
  PRIVATE_PAGE_PATHS.includes(routePath) ||
  PRIVATE_ROUTE_PREFIXES.some((prefix) => routePath.startsWith(prefix))

const isDynamic = (routePath: string): boolean => routePath.includes('[')

/**
 * Walk `src/app` for every `page.tsx` / `route.ts` and turn each one into the
 * route it serves. Route groups and private folders do not add a URL segment.
 */
function listAppRoutes(): AppRoute[] {
  const appDir = path.join(process.cwd(), 'src', 'app')
  if (!fs.existsSync(appDir)) {
    throw new Error(
      `[sitemap] cannot read ${appDir}. The sitemap coverage check needs the app directory; run it from the project root.`,
    )
  }

  const routes: AppRoute[] = []
  const visit = (dir: string, segments: string[]): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_') || entry.name.startsWith('@')) continue
        // `(group)` folders organise files without affecting the URL.
        if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
          visit(path.join(dir, entry.name), segments)
          continue
        }
        visit(path.join(dir, entry.name), [...segments, entry.name])
      } else if (entry.name.startsWith('page.')) {
        routes.push({ path: `/${segments.join('/')}`, kind: 'page' })
      } else if (entry.name.startsWith('route.')) {
        routes.push({ path: `/${segments.join('/')}`, kind: 'route' })
      }
    }
  }
  visit(appDir, [])
  return routes
}

export function auditSitemap(): SitemapAudit {
  const entries = getSitemapEntries()
  const excludedList = getExcludedPublicPaths()
  const excluded = new Map(excludedList.map((item) => [item.path, item.reason]))
  const sitemapPaths = entries.map((entry) => entry.path)
  const problems: string[] = []
  const warnings: string[] = []

  const counts = new Map<string, number>()
  for (const entryPath of sitemapPaths) {
    counts.set(entryPath, (counts.get(entryPath) ?? 0) + 1)
  }
  for (const [entryPath, count] of counts) {
    if (count > 1) problems.push(`sitemap lists ${entryPath} ${count} times`)
  }

  for (const entryPath of sitemapPaths) {
    if (entryPath.includes('?') || entryPath.includes('#')) {
      problems.push(`sitemap entry ${entryPath} contains a query string or fragment`)
    }
  }

  // lastModified must be a real content date: missing is honest, the build time
  // or a future date is not.
  const tomorrow = Date.now() + 86_400_000
  for (const entry of entries) {
    if (!entry.lastModified) {
      warnings.push(`${entry.path} has no content date — lastModified omitted rather than guessed`)
    } else if (entry.lastModified.getTime() > tomorrow) {
      problems.push(`${entry.path} has a future lastModified (${entry.lastModified.toISOString()})`)
    }
  }

  const appRoutes = listAppRoutes()
  const expected = new Map<string, string>()

  for (const route of appRoutes) {
    if (isDynamic(route.path) || route.kind === 'route') continue
    if (isPrivate(route.path)) continue
    const fileName = route.kind === 'page' ? 'page.tsx' : 'route.ts'
    const dir = route.path === '/' ? '' : route.path
    expected.set(route.path, `src/app${dir}/${fileName}`)
  }

  for (const route of appRoutes) {
    if (route.kind !== 'page' || !isDynamic(route.path)) continue
    const expand = DYNAMIC_ROUTE_SOURCES[route.path]
    if (!expand) {
      problems.push(
        `dynamic route ${route.path} is not mapped to a data source in DYNAMIC_ROUTE_SOURCES (src/lib/sitemap-routes.ts)`,
      )
      continue
    }
    for (const expanded of expand()) {
      expected.set(expanded, `${route.path} generated from data`)
    }
  }

  for (const [pagePath, origin] of expected) {
    if (counts.has(pagePath) || excluded.has(pagePath)) continue
    problems.push(`${pagePath} is a public page (${origin}) but is missing from the sitemap`)
  }

  for (const entryPath of sitemapPaths) {
    const reason = excluded.get(entryPath)
    if (reason) {
      problems.push(`${entryPath} is in the sitemap but is excluded: ${reason}`)
      continue
    }
    if (isPrivate(entryPath)) {
      problems.push(`${entryPath} is a private or utility route but is in the sitemap`)
      continue
    }
    if (!expected.has(entryPath)) {
      problems.push(`sitemap lists ${entryPath} but no built public page serves it`)
    }
  }

  return { problems, warnings, indexed: sitemapPaths, excluded: excludedList }
}

/** Throws when the sitemap and the built routes disagree. */
export function assertSitemapCoverage(): void {
  const audit = auditSitemap()

  for (const warning of audit.warnings) {
    console.warn(`[sitemap] warning: ${warning}`)
  }

  if (audit.problems.length > 0) {
    throw new Error(
      [
        `Sitemap coverage check failed (${audit.problems.length} problem${audit.problems.length === 1 ? '' : 's'}):`,
        ...audit.problems.map((problem) => `  - ${problem}`),
        '',
        'Routes live in src/lib/sitemap-routes.ts; the rule that classifies',
        'routes lives in src/lib/sitemap-coverage.ts.',
      ].join('\n'),
    )
  }

  console.log(
    `[sitemap] ${audit.indexed.length} URLs verified against the built routes (${audit.excluded.length} public page${audit.excluded.length === 1 ? '' : 's'} intentionally excluded).`,
  )
}
