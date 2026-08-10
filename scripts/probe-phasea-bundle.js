// Phase A item 3 verification: no dashboard code ships to public pages.
// Loads key public pages, collects every JS file, greps for dashboard markers.
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (url, method = 'GET') => fetch(url, { method }).then((r) => r.json())
let msgId = 0
const pending = new Map()
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((res) => { pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
}
const DASH_MARKERS = [
  'RealtimePanel',
  'an-realtime',
  'affiliateFeed',
  'analytics-queries',
  'analytics-aggregate',
  'ExportButtons',
  'getSourceRankings',
  'getLocationAnalytics',
  'getDeviceAnalytics',
  'recharts',
  'chart.js',
  'Live Affiliate',
]
const PAGES = ['/', '/shop', '/deals', '/product/rayneo-air-4-pro-batman-justice', '/blog/usb-c-accessories-under-50', '/faq']
async function main() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((res, rej) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => res(w); w.onerror = rej })
  const jsUrls = new Set()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
    if (m.method === 'Network.responseReceived' && m.params.type === 'Script') {
      jsUrls.add(m.params.response.url.split('?')[0])
    }
  }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable'); await send(ws, 'Network.enable')
  for (const p of PAGES) {
    await send(ws, 'Page.navigate', { url: SITE + p })
    await sleep(2600)
  }
  await send(ws, 'Page.close')
  await sleep(500)
  console.log('unique JS files loaded across public pages:', jsUrls.size)
  const hits = {}
  for (const marker of DASH_MARKERS) hits[marker] = []
  for (const u of jsUrls) {
    let t
    try { t = await (await fetch(u)).text() } catch { continue }
    for (const marker of DASH_MARKERS) {
      if (t.includes(marker)) hits[marker].push(u)
    }
  }
  let clean = true
  for (const [marker, urls] of Object.entries(hits)) {
    if (urls.length) { clean = false; console.log('LEAK:', marker, urls.length, urls.slice(0, 2)) }
  }
  console.log(clean ? 'NO DASHBOARD CODE IN PUBLIC BUNDLES — PASS' : 'DASHBOARD CODE FOUND IN PUBLIC BUNDLES — FAIL')
  console.log('total payload size of public JS:')
  let bytes = 0
  for (const u of jsUrls) bytes += (await (await fetch(u)).arrayBuffer()).byteLength
  console.log(Math.round(bytes / 1024) + ' KB')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
