// Direct endpoint tests against the LIVE site.
// Usage: node scripts/test-endpoints.js
const SITE = 'https://technest-bd.vercel.app'

async function main() {
  // 1. Track endpoint — valid payload
  let res = await fetch(SITE + '/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'test_ping',
      page: '/test-ping',
      session_id: 'endpoint-test-' + Date.now(),
      source: 'google',
      device: 'desktop',
      os: 'windows',
      browser: 'chrome',
      url: SITE + '/test-ping?utm_source=google&utm_medium=cpc',
      meta: { product_slug: 'test-product', note: 'endpoint smoke test' },
    }),
  })
  console.log('1. track valid:', res.status, (await res.json()).ok === true ? 'ok' : '?')

  // 2. Track endpoint — invalid (no session_id) should be 400
  res = await fetch(SITE + '/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'page_view' }),
  })
  console.log('2. track invalid (expect 400):', res.status)

  // 3. Track endpoint — GET should be 405
  res = await fetch(SITE + '/api/analytics/track')
  console.log('3. track GET (expect 405):', res.status)

  // 4. Admin endpoints without cookie — expect 401
  for (const p of [
    '/api/admin/analytics/realtime',
    '/api/admin/analytics/reports',
    '/api/admin/analytics/export?range=7',
    '/api/admin/analytics/aggregate',
  ]) {
    res = await fetch(SITE + p, {
      method: p.includes('aggregate') ? 'POST' : 'GET',
    })
    console.log(`4. ${p} no-auth (expect 401):`, res.status)
  }

  // 5. Cron endpoint (no CRON_SECRET configured → runs; tables exist now)
  res = await fetch(SITE + '/api/analytics/cron')
  const body = await res.json().catch(() => ({}))
  console.log('5. cron:', res.status, body.ok === true ? 'ok' : JSON.stringify(body).slice(0, 200))
}

main().catch((e) => {
  console.error('endpoint test error:', e)
  process.exit(1)
})
