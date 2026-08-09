import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getDb } from '@/lib/supabase'
import {
  getTopProducts,
  getTopCategories,
  getTopBlogPosts,
  getSourceRankings,
  getSearchRankings,
  getSearchClickRank,
  getFaqExpandRanking,
  getFaqGoogleTraffic,
  getDeviceAnalytics,
  getLocationAnalytics,
} from '@/lib/analytics-queries'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  return [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')),
  ].join('\n')
}

function pdfTable(
  doc: InstanceType<typeof PDFDocument>,
  headers: string[],
  rows: (string | number)[][],
  colWidths: number[],
) {
  const margin = 40
  let y = doc.y + 8
  const drawRow = (cells: (string | number)[], bold: boolean) => {
    const h = 18
    if (y + h > doc.page.height - margin) {
      doc.addPage()
      y = margin
    }
    let x = margin
    cells.forEach((c, i) => {
      if (bold) doc.font('Helvetica-Bold') as unknown
      else doc.font('Helvetica') as unknown
      doc.fontSize(8)
      doc.text(String(c), x, y + 5, { width: colWidths[i], height: h - 8 })
      x += colWidths[i]
    })
    y += h
  }
  drawRow(headers, true)
  rows.forEach((r) => drawRow(r, false))
  doc.y = y
}

export async function GET(request: Request) {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const range = Math.min(90, Math.max(1, Number(searchParams.get('range') ?? 30)))
  const formatRaw = searchParams.get('format') ?? 'csv'
  const format = ['csv', 'json', 'xlsx', 'pdf'].includes(formatRaw)
    ? (formatRaw as 'csv' | 'json' | 'xlsx' | 'pdf')
    : 'csv'
  const scope = ['daily', 'devices', 'locations', 'search'].includes(
    searchParams.get('scope') ?? '',
  )
    ? (searchParams.get('scope') as 'daily' | 'devices' | 'locations' | 'search')
    : 'daily'
  const daysAgo = new Date(Date.now() - range * 86400000).toISOString()

  try {
    const db = getDb()
    const { data: daily, error } = await db
      .from('analytics_daily')
      .select('*')
      .gte('date', daysAgo.slice(0, 10))
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)

    const [products, categories, blogPosts, sources, searchRanks, searchClicks, faqExpands, faqGoogle, devices, locations] =
      await Promise.all([
        getTopProducts(range),
        getTopCategories(range),
        getTopBlogPosts(range),
        getSourceRankings(range),
        getSearchRankings(range),
        getSearchClickRank(range),
        getFaqExpandRanking(range),
        getFaqGoogleTraffic(range),
        getDeviceAnalytics(range),
        getLocationAnalytics(range),
      ])

    const dailyRows = (daily ?? []).map((d) => ({
      date: String(d.date).slice(0, 10),
      source: d.source,
      device: d.device,
      country: d.country,
      visitors: d.visitors,
      unique_visitors: d.unique_visitors,
      sessions: d.sessions,
      page_views: d.page_views,
      bounces: d.bounces,
      session_seconds: d.session_seconds,
      affiliate_clicks: d.affiliate_clicks,
      add_to_cart: d.add_to_cart,
      checkouts: d.checkouts,
      newsletter_subscribes: d.newsletter_subscribes,
    }))

    const summary = {
      range,
      scope,
      daily: dailyRows,
      top_products: products,
      top_categories: categories,
      top_blog_posts: blogPosts,
      source_rankings: sources,
      search_rankings: searchRanks,
      search_click_rank: searchClicks,
      faq_expands: faqExpands,
      faq_google_traffic: faqGoogle,
      devices,
      locations,
      generated_at: new Date().toISOString(),
    }

    const filename = `technest-${scope}-${range}d`

    if (format === 'json') return NextResponse.json(summary)

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new()
      const sheet = (name: string, rows: Record<string, unknown>[]) => {
        if (rows.length === 0) return
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name)
      }
      if (scope === 'daily') {
        sheet('Daily', dailyRows)
        sheet('Top Products', products as unknown as Record<string, unknown>[])
        sheet('Top Blog Posts', blogPosts as unknown as Record<string, unknown>[])
        sheet('Sources', sources as unknown as Record<string, unknown>[])
      } else if (scope === 'devices') {
        sheet('Devices', devices.devices as unknown as Record<string, unknown>[])
        sheet('OS', devices.os as unknown as Record<string, unknown>[])
        sheet('Browsers', devices.browsers as unknown as Record<string, unknown>[])
      } else if (scope === 'locations') {
        sheet('Countries', locations.map((l) => ({
          country: l.country,
          country_name: l.countryName,
          sessions: l.sessions,
          page_views: l.pageViews,
          conversions: l.conversions,
          conversion_rate: l.conversionRate,
        })))
        sheet('Cities', locations.flatMap((l) =>
          l.cities.map((c) => ({ country: l.countryName, city: c.city, sessions: c.sessions, page_views: c.pageViews, conversions: c.conversions })),
        ))
      } else if (scope === 'search') {
        sheet('Product Searches', searchRanks.product as unknown as Record<string, unknown>[])
        sheet('Blog Searches', searchRanks.blog as unknown as Record<string, unknown>[])
        sheet('Search Click Rank', [
          ...searchClicks.product.map((p) => ({ kind: 'product', slug: p.slug, name: p.name, clicks: p.clicks })),
          ...searchClicks.blog.map((b) => ({ kind: 'blog', slug: b.slug, name: b.name, clicks: b.clicks })),
        ])
        sheet('FAQ Expands', faqExpands as unknown as Record<string, unknown>[])
        sheet('FAQ Google Traffic', faqGoogle as unknown as Record<string, unknown>[])
      }
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      })
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      const done = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)))
      })
      doc.font('Helvetica-Bold').fontSize(14).text('TechNest Analytics — ' + scope + ' (last ' + range + ' days)', { align: 'left' })
      doc.font('Helvetica').fontSize(9).text('Generated ' + new Date().toISOString())
      doc.moveDown()

      if (scope === 'daily') {
        doc.font('Helvetica-Bold').fontSize(11).text('Daily Summary')
        pdfTable(doc, ['Date', 'Source', 'Device', 'Country', 'Visitors', 'Views', 'Sessions', 'Clicks', 'ATC'],
          dailyRows.map((d) => [d.date, String(d.source ?? ''), String(d.device ?? ''), String(d.country ?? ''), d.visitors, d.page_views, d.sessions, d.affiliate_clicks, d.add_to_cart]),
          [58, 55, 50, 50, 45, 45, 45, 40, 40])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Top Products')
        pdfTable(doc, ['Slug', 'Views', 'ATC', 'Clicks', 'Conv'],
          products.map((p) => [p.slug, p.views, p.addToCart, p.clicks, p.conversions]),
          [160, 50, 50, 50, 50])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Top Blog Posts')
        pdfTable(doc, ['Slug', 'Views', 'Card Clicks', 'Deep Reads', 'Avg Sec', 'Eng.'],
          blogPosts.map((b) => [b.slug, b.views, b.cardClicks, b.deepReads, b.avgSeconds, b.engagement + '%']),
          [160, 45, 60, 55, 45, 45])
      } else if (scope === 'devices') {
        doc.font('Helvetica-Bold').fontSize(11).text('Device Distribution')
        pdfTable(doc, ['Device', 'Sessions', 'Page Views', 'Conversions', 'Conv %'],
          devices.devices.map((d) => [d.key, d.sessions, d.pageViews, d.conversions, d.conversionRate + '%']),
          [110, 70, 70, 70, 70])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Operating Systems')
        pdfTable(doc, ['OS', 'Sessions', 'Page Views', 'Conversions', 'Conv %'],
          devices.os.map((d) => [d.key, d.sessions, d.pageViews, d.conversions, d.conversionRate + '%']),
          [110, 70, 70, 70, 70])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Browsers')
        pdfTable(doc, ['Browser', 'Sessions', 'Page Views', 'Conversions', 'Conv %'],
          devices.browsers.map((d) => [d.key, d.sessions, d.pageViews, d.conversions, d.conversionRate + '%']),
          [110, 70, 70, 70, 70])
      } else if (scope === 'locations') {
        doc.font('Helvetica-Bold').fontSize(11).text('Top Locations')
        pdfTable(doc, ['Country', 'Sessions', 'Page Views', 'Conversions', 'Conv %'],
          locations.map((l) => [l.countryName, l.sessions, l.pageViews, l.conversions, l.conversionRate + '%']),
          [150, 70, 70, 70, 70])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Top Cities')
        pdfTable(doc, ['Country', 'City', 'Sessions', 'Page Views', 'Conversions'],
          locations.flatMap((l) => l.cities.map((c) => [l.countryName, c.city, c.sessions, c.pageViews, c.conversions])),
          [130, 110, 60, 60, 60])
      } else if (scope === 'search') {
        doc.font('Helvetica-Bold').fontSize(11).text('Product Search Rank')
        pdfTable(doc, ['Term', 'Searches', 'No Results', 'Click-Through', 'Rate'],
          searchRanks.product.map((t) => [t.term, t.searches, t.noResults, t.clickThrough, t.clickRate + '%']),
          [170, 60, 60, 70, 50])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Blog Search Rank')
        pdfTable(doc, ['Term', 'Searches', 'No Results', 'Click-Through', 'Rate'],
          searchRanks.blog.map((t) => [t.term, t.searches, t.noResults, t.clickThrough, t.clickRate + '%']),
          [170, 60, 60, 70, 50])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('Search-to-Click Rank')
        pdfTable(doc, ['Kind', 'Name', 'Clicks'],
          [
            ...searchClicks.product.map((p) => ['product', p.name, p.clicks]),
            ...searchClicks.blog.map((b) => ['blog', b.name, b.clicks]),
          ],
          [70, 240, 60])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('FAQ Expands (in-site)')
        pdfTable(doc, ['Question', 'Count', 'Location'],
          faqExpands.map((f) => [f.question, f.count, f.location]),
          [280, 50, 60])
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(11).text('FAQ Google Traffic')
        pdfTable(doc, ['Page', 'Views', 'Sessions'],
          faqGoogle.map((g) => [g.page, g.views, g.sessions]),
          [200, 60, 60])
      }

      doc.end()
      const buf = await done
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      })
    }

    // csv
    if (scope !== 'daily') {
      let rows: Record<string, unknown>[] = []
      let cols: string[] = []
      if (scope === 'devices') {
        rows = [
          ...devices.devices.map((d) => ({ group: 'device', key: d.key, sessions: d.sessions, page_views: d.pageViews, conversions: d.conversions, conversion_rate: d.conversionRate + '%' })),
          ...devices.os.map((d) => ({ group: 'os', key: d.key, sessions: d.sessions, page_views: d.pageViews, conversions: d.conversions, conversion_rate: d.conversionRate + '%' })),
          ...devices.browsers.map((d) => ({ group: 'browser', key: d.key, sessions: d.sessions, page_views: d.pageViews, conversions: d.conversions, conversion_rate: d.conversionRate + '%' })),
        ]
        cols = ['group', 'key', 'sessions', 'page_views', 'conversions', 'conversion_rate']
      } else if (scope === 'locations') {
        rows = locations.map((l) => ({
          country: l.country, country_name: l.countryName, sessions: l.sessions,
          page_views: l.pageViews, conversions: l.conversions, conversion_rate: l.conversionRate + '%',
        }))
        cols = ['country', 'country_name', 'sessions', 'page_views', 'conversions', 'conversion_rate']
      } else {
        rows = [
          ...searchRanks.product.map((t) => ({ kind: 'product-search', term: t.term, searches: t.searches, no_results: t.noResults, click_through: t.clickThrough, rate: t.clickRate + '%' })),
          ...searchRanks.blog.map((t) => ({ kind: 'blog-search', term: t.term, searches: t.searches, no_results: t.noResults, click_through: t.clickThrough, rate: t.clickRate + '%' })),
          ...searchClicks.product.map((p) => ({ kind: 'product-click', name: p.name, clicks: p.clicks })),
          ...searchClicks.blog.map((b) => ({ kind: 'blog-click', name: b.name, clicks: b.clicks })),
          ...faqExpands.map((f) => ({ kind: 'faq-expand', question: f.question, count: f.count, location: f.location })),
          ...faqGoogle.map((g) => ({ kind: 'faq-google', page: g.page, views: g.views, sessions: g.sessions })),
        ]
        cols = ['kind', 'term', 'searches', 'no_results', 'click_through', 'rate', 'name', 'clicks', 'question', 'count', 'location', 'page', 'views', 'sessions']
      }
      const csv = toCsv(rows, cols)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    const cols = [
      'date', 'source', 'device', 'country', 'visitors', 'unique_visitors', 'sessions',
      'page_views', 'bounces', 'session_seconds', 'affiliate_clicks', 'add_to_cart',
      'checkouts', 'newsletter_subscribes',
    ]
    const csv = toCsv(dailyRows, cols)
    const productCsv = toCsv(
      products.map((p) => ({ ...p, name: p.name })),
      ['slug', 'name', 'views', 'addToCart', 'clicks', 'conversions'],
    )
    const combined =
      'TECHNEST ANALYTICS EXPORT - last ' + range + ' days\n\nDAILY\n' + csv +
      '\n\nTOP PRODUCTS\n' + productCsv +
      '\n\nTOP BLOG POSTS\n' +
      toCsv(
        blogPosts.map((b) => ({ ...b })),
        ['slug', 'title', 'views', 'cardClicks', 'deepReads', 'avgSeconds', 'engagement'],
      )

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Export failed.', detail: String(err) },
      { status: 500 },
    )
  }
}
