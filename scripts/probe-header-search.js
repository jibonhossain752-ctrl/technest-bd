// Reproduce the exact verify-b1b3b7d header-search sequence.
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
  if (msg.exceptionDetails) return 'EXC:' + (msg.exceptionDetails.exception ? msg.exceptionDetails.exception.description : msg.exceptionDetails.text)
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
async function main() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((res, rej) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => res(w); w.onerror = rej })
  const trackPosts = []
  const errors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('/api/analytics/track')) {
      try { trackPosts.push(JSON.parse(m.params.request.postData).event) } catch {}
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 300))
    }
  }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable'); await send(ws, 'Network.enable')
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  console.log('waitFor input:', await waitFor(ws, "document.querySelector('.header-search input')"))
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
  console.log('URL:', await evaluate(ws, 'location.href'))
  console.log('track:', JSON.stringify(trackPosts))
  console.log('exceptions:', JSON.stringify(errors))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
