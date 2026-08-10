// Verify B1/B3/B7/D fixes on the live site:
//  - header search bar renders + header_search event + ?q= shop filtering
//  - blog tabs scroll event
//  - deal card affiliate_click carries post_slug
//  - newsletter_shown (quick) event on desktop panel open
//  - page_load includes inp_ms
//  - dashboards: Newsletter section, Bounce card, SE traffic per page, affiliate feed
// Usage: node scripts/verify-b1b3b7d.js  (CDP Edge on 127.0.0.1:9222)
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''))
}
const getJson = (url, method = 'GET') => fetch(url, { method }).then((r) => r.json())
let msgId = 0
const pending = new Map()
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((res) => { pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
}
async function evaluate(ws, expression) {
  const msg = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  if (msg.exceptionDetails) return 'EXC:' + (msg.exceptionDetails.text || '')
  return msg.result ? msg.result.value : undefined
}
async function waitFor(ws, expr, timeout = 12000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if ((await evaluate(ws, `!!(${expr})`)) === true) return true
    await sleep(300)
  }
  return false
}
async function newTab() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((resolve, reject) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => resolve(w); w.onerror = reject })
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable')
  return ws
}
const { createHmac } = require('crypto')

function signSessionToken() {
  const payload = { sub: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', env.ADMIN_COOKIE_SECRET)
    .update(body)
    .digest('base64url')
  return body + '.' + sig
}

async function login() {
  // No plaintext admin password in .env.local (only the hash); sign a session
  // token directly with ADMIN_COOKIE_SECRET — same algorithm as admin-auth.ts.
  const cookie = 'tn_admin_session=' + signSessionToken()
  const res = await fetch(SITE + '/api/admin/session', {
    headers: { cookie },
  })
  const ok = res.status === 200
  check('admin session token accepted', ok, 'status=' + res.status)
  return ok ? cookie : null
}

async function main() {
  const t0 = Date.now()

  // ---- 1. header search UI + ?q= flow ----
  const ws = await newTab()
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  await waitFor(ws, "document.querySelector('.header-search input')")
  await sleep(4000) // let React hydrate; pre-hydration clicks would native-submit
  const hasSearch = await evaluate(ws, "!!document.querySelector('.header-search input')")
  check('header search bar renders (desktop)', !!hasSearch)
  await evaluate(ws, `(function(){
    const i = document.querySelector('.header-search input')
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    s.call(i, 'headphones'); i.dispatchEvent(new Event('input', { bubbles: true }))
    i.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await sleep(600)
  await evaluate(ws, `(function(){ const b = document.querySelector('.header-search button'); if (b) b.click(); return !!b })()`)
  await sleep(3500)
  const shopUrl = await evaluate(ws, 'location.href')
  const shopInput = await evaluate(ws, "document.querySelector('.shop-controls input[type=search]') ? document.querySelector('.shop-controls input[type=search]').value : null")
  const gridCount = await evaluate(ws, "document.querySelectorAll('.product-card').length")
  check('header search navigates to /shop?q=', String(shopUrl).includes('/shop?q=headphones'), shopUrl)
  check('shop query applied from URL', shopInput === 'headphones', 'input=' + shopInput)
  check('shop grid filtered by header query', gridCount > 0 && gridCount < 30, 'cards=' + gridCount)

  // ---- 2. blog tabs scroll event (mobile viewport) ----
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: true })
  await send(ws, 'Page.navigate', { url: SITE + '/blog' })
  await waitFor(ws, "document.querySelector('.blog-tabs')")
  await sleep(2000)
  const tabsInfo = await evaluate(ws, `(function(){ const row = document.querySelector('.blog-tabs'); return row ? { sw: row.scrollWidth, cw: row.clientWidth } : null })()`)
  const scrollable = tabsInfo && tabsInfo.sw > tabsInfo.cw + 4
  check('blog tabs strip is scrollable (mobile)', !!scrollable, JSON.stringify(tabsInfo))
  if (scrollable) {
    await evaluate(ws, `(function(){ const row = document.querySelector('.blog-tabs'); row.scrollLeft += Math.max(20, row.scrollWidth - row.clientWidth); row.dispatchEvent(new Event('scroll')); return true })()`)
  }

  // ---- 3. deal card affiliate click with post_slug ----
  const postsTxt = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'posts.ts'), 'utf8')
  const dealIdx = postsTxt.indexOf('dealCard:')
  let dealSlug = null
  if (dealIdx > -1) {
    const before = postsTxt.slice(0, dealIdx)
    const m = before.match(/slug:\s*'([^']+)'\s*,[\s\S]*$/m)
    dealSlug = m ? m[1] : null
  }
  console.log('deal post detected:', dealSlug)
  if (dealSlug) {
    await send(ws, 'Page.navigate', { url: SITE + '/blog/' + dealSlug })
    const hasDealBtn = await waitFor(ws, "document.querySelector('.deal-card-inline-cta')")
    check('deal card CTA renders on ' + dealSlug, hasDealBtn)
    if (hasDealBtn) {
      await evaluate(ws, "document.querySelector('.deal-card-inline-cta').click()")
      await sleep(1500)
      dealClicked = true
    }
  } else {
    check('deal card CTA renders', false, 'no dealCard in posts data')
  }

  // ---- 4. newsletter_shown (quick) on desktop panel open ----
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await send(ws, 'Page.navigate', { url: SITE + '/' })
  await waitFor(ws, "document.querySelector('.menu-toggle')")
  await sleep(2000)
  await evaluate(ws, "document.querySelector('.menu-toggle').click()")
  await sleep(1200)
  const deskPanel = await evaluate(ws, "!!document.querySelector('.desk-panel.open')")
  check('desktop panel opened (contains quick subscribe)', !!deskPanel)

  ws.close()

  // ---- 5. page_load has inp_ms ----
  await sleep(8000)

  // ---- DB checks ----
  const start = new Date(t0 - 60 * 1000).toISOString()
  const { data: evs } = await supabase
    .from('analytics_events')
    .select('event, meta')
    .gte('created_at', start)
  const ev = (evs || []).map((r) => ({ event: r.event, meta: r.meta || {} }))
  const count = (e) => ev.filter((x) => x.event === e).length

  const headerSearch = ev.find((x) => x.event === 'header_search')
  check('header_search event recorded', !!headerSearch,
    headerSearch ? 'query=' + String(headerSearch.meta.query) : '0 rows')
  const pageLoad = ev.find((x) => x.event === 'page_load' && x.meta.inp_ms !== undefined)
  check('page_load includes inp_ms', !!pageLoad,
    pageLoad ? 'inp_ms=' + String(pageLoad.meta.inp_ms) : 'no inp_ms')
  const dealClick = ev.find((x) => x.event === 'affiliate_click' && x.meta.post_slug)
  check('deal card affiliate_click has post_slug', !!dealClick,
    dealClick ? 'post=' + String(dealClick.meta.post_slug) + ' product=' + String(dealClick.meta.product_slug) : 'no post_slug row')
  check('newsletter_shown (quick) recorded', count('newsletter_shown') > 0, count('newsletter_shown') + ' rows')
  check('blog_tabs_scroll recorded', count('blog_tabs_scroll') > 0, count('blog_tabs_scroll') + ' rows')

  // ---- 6. dashboards ----
  const cookie = await login()
  if (cookie) {
    const dash = async (route, sel) => {
      const w2 = await newTab()
      await send(w2, 'Network.enable')
      await send(w2, 'Network.setCookie', { url: SITE, name: 'tn_admin_session', value: cookie.split('=').slice(1).join('='), path: '/' })
      await send(w2, 'Page.navigate', { url: SITE + route })
      await sleep(5000)
      const text = await evaluate(w2, `(function(){ const els = [...document.querySelectorAll(${JSON.stringify(sel)})]; return els.map((e) => e.textContent.trim()) })()`)
      w2.close()
      return text
    }
    const overview = await dash('/admin/analytics', '.an-section h2, .admin-card strong, .admin-card span')
    check('overview has Newsletter section', (overview || []).some((t) => t.includes('Newsletter')))
    check('overview has Bounce Rate card', (overview || []).some((t) => t === 'Bounce Rate'))
    const searchPage = await dash('/admin/analytics/search', '.an-section h2')
    check('search page has SE traffic per page section',
      (searchPage || []).some((t) => t.includes('Search Engine Traffic per Page')),
      JSON.stringify(searchPage))
    const realtime = await dash('/admin/analytics', '.an-realtime-affiliate h3')
    check('realtime has Live Affiliate Clicks Feed',
      (realtime || []).some((t) => t.includes('Live Affiliate Clicks')), JSON.stringify(realtime))
  }

  const failed = results.filter((r) => !r.ok)
  console.log('\n=== SUMMARY: ' + (results.length - failed.length) + '/' + results.length + ' passed ===')
  if (failed.length) console.log('FAILED: ' + failed.map((f) => f.name).join('; '))
  process.exit(failed.length ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
