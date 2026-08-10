const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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
  if (msg.exceptionDetails) return 'EXC: ' + (msg.exceptionDetails.exception?.description || 'unknown')
  return msg.result ? msg.result.value : 'NO-RESULT'
}
const PROBE = `(function(){
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) } }
  const img = document.querySelector('.hero-static-img')
  const imgEl = document.querySelector('.hero-static-img-el')
  const text = document.querySelector('.hero-static-text')
  const tag = document.querySelector('.hero-static-tag')
  const sec = document.querySelector('.hero-static')
  return {
    section: r(sec),
    imgWrap: r(img),
    imgEl: r(imgEl),
    imgSrc: imgEl ? imgEl.getAttribute('src') : null,
    text: r(text),
    tag: r(tag),
    imgComputed: img ? { display: getComputedStyle(img).display, animation: getComputedStyle(img).animationName, transform: getComputedStyle(img).transform } : null,
  }
})()`
async function main() {
  const tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
  const ws = await connect(tab.webSocketDebuggerUrl)
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) }
  }
  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 })
  await send(ws, 'Page.navigate', { url: SITE + '/' })
  await sleep(6500)
  console.log('mobile:', JSON.stringify(await evaluate(ws, PROBE), null, 2))
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 900 })
  await send(ws, 'Page.navigate', { url: SITE + '/' })
  await sleep(6500)
  console.log('desktop:', JSON.stringify(await evaluate(ws, PROBE), null, 2))
  ws.close()
  process.exit(0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
