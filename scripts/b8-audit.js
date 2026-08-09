// B8 per-page tracking audit.
// 1. Enumerates every route from the data files (products, posts, categories, views).
// 2. Visits each route via CDP (fires page_view per pathname).
// 3. Exercises in-page filters (blog tabs, deals category chips).
// 4. Verifies against analytics_events that EVERY route has distinct, reportable data.
// Usage: node scripts/b8-audit.js   (CDP Edge on 127.0.0.1:9222)
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- env from .env.local ----
const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ---- route inventory from data files ----
const DATA = path.join(__dirname, '..', 'src', 'data')
const slugRe = /slug:\s*'([^']+)'/g
function slugs(file) {
  const txt = fs.readFileSync(path.join(DATA, file), 'utf8')
  const out = []
  let m
  while ((m = slugRe.exec(txt))) out.push(m[1])
  return out
}
const VIEW_SLUGS = ['featured', 'flash-sale', 'new-arrivals']
const productSlugs = slugs('products.ts').filter((s) => !VIEW_SLUGS.includes(s))
const postSlugs = slugs('posts.ts')
const catSlugs = slugs('categories.ts')

const staticRoutes = ['/', '/shop', '/deals', '/blog', '/cart', '/checkout', '/about', '/contact', '/faq']
const shopRoutes = [...VIEW_SLUGS, ...catSlugs].map((s) => `/shop/${s}`)
const productRoutes = productSlugs.map((s) => `/product/${s}`)
const blogRoutes = postSlugs.map((s) => `/blog/${s}`)
const ALL_ROUTES = [...staticRoutes, ...shopRoutes, ...productRoutes, ...blogRoutes]
const BLOG_TABS = ['All', 'Reviews', 'Buying Guides', 'Tips & Tricks', 'Explainer']
const DEAL_CHIPS = ['All', ...catSlugs]

// ---- CDP plumbing ----
async function getJson(url, method = 'GET') { return (await fetch(url, { method })).json() }
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.onopen = () => resolve(ws)
    ws.onerror = (e) => reject(new Error('ws error ' + String(e)))
  })
}
let msgId = 0
const pending = new Map()
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((resolve) => {
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(ws, expression) {
  const msg = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  if (msg.exceptionDetails) return 'EXC'
  return msg.result ? msg.result.value : undefined
}
async function waitFor(ws, expr, timeout = 10000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if ((await evaluate(ws, `!!(${expr})`)) === true) return true
    await sleep(300)
  }
  return false
}

// ---- DB verification ----
async function verify() {
  const rows = {}
  let total = 0
  const start = new Date(Date.now() - 1000 * 60 * 30).toISOString()
  const { data, error } = await supabase
    .from('analytics_events')
    .select('page, meta')
    .eq('event', 'page_view')
    .gte('created_at', start)
  if (error) throw new Error('page_view query: ' + error.message)
  for (const r of data || []) {
    const p = r.page || '(none)'
    rows[p] = (rows[p] || 0) + 1
    total++
  }
  const tabs = {}
  const { data: tabData } = await supabase
    .from('analytics_events')
    .select('meta')
    .eq('event', 'blog_tab_click')
    .gte('created_at', start)
  for (const r of tabData || []) {
    const t = r.meta && r.meta.tab ? r.meta.tab : '?'
    tabs[t] = (tabs[t] || 0) + 1
  }
  const chips = {}
  const { data: chipData } = await supabase
    .from('analytics_events')
    .select('meta')
    .eq('event', 'category_select')
    .gte('created_at', start)
  for (const r of chipData || []) {
    const s = r.meta && r.meta.slug ? r.meta.slug : '?'
    chips[s] = (chips[s] || 0) + 1
  }
  return { rows, total, tabs, chips }
}

async function main() {
  console.log(`Routes to visit: ${ALL_ROUTES.length} (${productRoutes.length} products, ${blogRoutes.length} posts, ${shopRoutes.length} shop views/cats, ${staticRoutes.length} static)`)
  const tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
  const ws = await connect(tab.webSocketDebuggerUrl)
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) }
  }
  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })

  let ok = 0, fail = 0
  const missing = []
  for (let i = 0; i < ALL_ROUTES.length; i++) {
    const route = ALL_ROUTES[i]
    await send(ws, 'Page.navigate', { url: SITE + route })
    await sleep(5200)
    const loaded = await evaluate(ws, `document.readyState`)
    if (loaded === 'complete') ok++
    else { fail++; missing.push(route) }
    if ((i + 1) % 20 === 0) console.log(`  visited ${i + 1}/${ALL_ROUTES.length}`)
  }

  console.log('clicking blog tabs...')
  await send(ws, 'Page.navigate', { url: SITE + '/blog' })
  await waitFor(ws, "document.querySelector('.blog-tab')")
  for (const t of BLOG_TABS) {
    await evaluate(ws, `(function(){ const b = [...document.querySelectorAll('.blog-tab')].find((x) => x.textContent.trim() === ${JSON.stringify(t)}); if (b) b.click(); return !!b })()`)
    await sleep(800)
  }

  console.log('clicking deals chips...')
  await send(ws, 'Page.navigate', { url: SITE + '/deals' })
  await waitFor(ws, "document.querySelector('.shop-cat-chip')")
  for (const c of DEAL_CHIPS) {
    await evaluate(ws, `(function(){ const b = [...document.querySelectorAll('.shop-cat-chip')].find((x) => x.textContent.trim().toLowerCase().includes(${JSON.stringify(c.toLowerCase())})); if (b) b.click(); return !!b })()`)
    await sleep(800)
  }
  ws.close()

  // ---- verify ----
  await sleep(3000)
  const { rows, total, tabs, chips } = await verify()
  console.log('\n=== B8 AUDIT RESULT ===')
  console.log(`total page_view rows (last 30min): ${total}`)
  const perRoute = new Map()
  let missingData = []
  for (const route of ALL_ROUTES) {
    const has = (rows[route] || 0) > 0
    perRoute.set(route, has)
    if (!has) missingData.push(route)
  }
  console.log('missing page_view:', missingData.length ? missingData.join(', ') : 'none')
  console.log('blog_tab_click:', JSON.stringify(tabs))
  console.log('category_select (shop+deals chips):', JSON.stringify(chips))

  const lines = []
  lines.push('| Route | Distinct page_view rows |', '|---|---|')
  for (const route of ALL_ROUTES) lines.push(`| ${route} | ${rows[route] || 0} |`)
  lines.push('', '| In-page filter | Event | Distinct rows |', '|---|---|---|')
  for (const t of BLOG_TABS) lines.push(`| Blog tab: ${t} | blog_tab_click | ${tabs[t] || 0} |`)
  for (const c of DEAL_CHIPS) lines.push(`| Deals chip: ${c} | category_select | ${chips[c] || 0} |`)
  fs.writeFileSync(path.join(__dirname, 'b8-audit.md'), lines.join('\n'))
  console.log('saved -> scripts/b8-audit.md')
  console.log(`RESULT: ${ALL_ROUTES.length - missingData.length}/${ALL_ROUTES.length} routes verified with distinct data${missingData.length ? '; MISSING: ' + missingData.join(', ') : ''}`)
  process.exit(missingData.length ? 2 : 0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
