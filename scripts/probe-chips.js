// Click every deals chip on the live site and verify each records distinctly.
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
const getJson = (url, method = 'GET') => fetch(url, { method }).then((r) => r.json())
let msgId = 0
const pending = new Map()
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((res) => { pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
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
const chips = ['All', 'Laptops', 'Smartphones', 'Audio & Wearables', 'Gaming', 'Accessories', 'Networking', 'Cameras', 'Smart Home']

async function main() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((resolve, reject) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => resolve(w); w.onerror = reject })
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable')
  await send(ws, 'Page.navigate', { url: SITE + '/deals' })
  if (!(await waitFor(ws, "document.querySelector('.shop-cat-chip')"))) { console.log('no chips found'); process.exit(1) }
  await sleep(2000)
  const found = await evaluate(ws, `[...document.querySelectorAll('.shop-cat-chip')].map((x) => x.textContent.trim())`)
  console.log('chips on page:', JSON.stringify(found))
  for (const c of chips) {
    const clicked = await evaluate(ws, `(function(){ const b = [...document.querySelectorAll('.shop-cat-chip')].find((x) => x.textContent.trim().toLowerCase().includes(${JSON.stringify(c.toLowerCase())})); if (b) { b.click(); return true } return false })()`)
    console.log('clicked:', c, '->', clicked)
    await sleep(900)
  }
  await sleep(4000)
  ws.close()
  const start = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data } = await supabase.from('analytics_events').select('page, meta').eq('event', 'category_select').gte('created_at', start)
  const by = {}
  for (const r of data || []) {
    const key = (r.meta && r.meta.slug) || '?'
    by[key] = by[key] || []
    by[key].push(r.page)
  }
  console.log('recorded in last 10min:', JSON.stringify(by, null, 1))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
