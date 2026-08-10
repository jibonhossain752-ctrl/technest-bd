// Phase A item 1 verification: tracking request timing (async, ~2.5s after load)
// and dedupe (same event/page within 2s -> single request).
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
async function evaluate(ws, expression) {
  const msg = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  if (msg.exceptionDetails) return 'EXC:' + (msg.exceptionDetails.exception?.description ?? msg.exceptionDetails.text)
  return msg.result ? msg.result.value : undefined
}
async function waitFor(ws, expr, timeout = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if ((await evaluate(ws, `!!(${expr})`)) === true) return true
    await sleep(250)
  }
  return false
}
async function main() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((res, rej) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => res(w); w.onerror = rej })
  const posts = [] // {event, t}
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('/api/analytics/track')) {
      try { posts.push({ event: JSON.parse(m.params.request.postData).event, t: Date.now() }) } catch {}
    }
  }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable'); await send(ws, 'Network.enable')
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  const origin = await evaluate(ws, 'Math.round(performance.timeOrigin)') // wall clock of nav start
  await waitFor(ws, "document.querySelector('.sort-select') || document.querySelector('select')")
  await sleep(3000) // let page_view (2500ms) land before the dedupe test
  // timing baseline: record when page fully interactive-ish (hydration marker is the sort select)
  // 1) dedupe: same sort option clicked twice rapidly -> 1 shop_sort request
  await evaluate(ws, `(function(){
    const sel = document.querySelector('.sort-select') || document.querySelector('select')
    if (!sel) return 'no-sort-select'
    const setVal = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
    setVal.call(sel, sel.options[1] ? sel.options[1].value : sel.options[0].value)
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await sleep(150)
  await evaluate(ws, `(function(){
    const sel = document.querySelector('.sort-select') || document.querySelector('select')
    const setVal = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
    setVal.call(sel, sel.options[1] ? sel.options[1].value : sel.options[0].value)
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await sleep(1200)
  const fcp = await evaluate(ws, `(function(){ const e = performance.getEntriesByType('paint').filter(p => p.name === 'first-contentful-paint'); return e.length ? Math.round(e[0].startTime) : null })()`)
  const shopSortPosts = posts.filter((p) => p.event === 'shop_sort')
  const pageViewPosts = posts.filter((p) => p.event === 'page_view')
  const shopSortDedupOk = shopSortPosts.length === 1
  const timingMs = pageViewPosts.length ? pageViewPosts[0].t - origin : null
  console.log('all track posts:', JSON.stringify(posts.map((p) => p.event)))
  console.log('page_view posts:', pageViewPosts.length, '| delay after nav start:', timingMs, 'ms (expect ~2500)')
  console.log('shop_sort posts:', shopSortPosts.length, '| dedupe OK:', shopSortDedupOk)
  console.log('fcp:', fcp, 'ms | page_view fired AFTER fcp (async, non-blocking):', timingMs !== null && fcp !== null && timingMs > fcp)
  // 2) dedupe on tab close: pagehide + visibilitychange both call track('time_on_page') -> dedupe collapses to 1
  await send(ws, 'Page.close')
  await sleep(800)
  const topPosts = await getJson(CDP + '/json/list')
  console.log('tab closed for time_on_page dedupe check (see DB for time_on_page count)')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
