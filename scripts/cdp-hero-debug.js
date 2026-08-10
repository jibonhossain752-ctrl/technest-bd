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
  await sleep(6000)
  console.log(await evaluate(ws, `(function(){
    const r = {}
    r.slides = document.querySelectorAll('.hero-slide').length
    r.active = document.querySelectorAll('.hero-slide.active').length
    r.emojiAll = document.querySelectorAll('.hero-emoji').length
    r.heroPresent = !!document.querySelector('.hero')
    r.bodyText = document.body.innerText.slice(0, 300)
    return r
  })()`))
  await sleep(2000)
  console.log('after 2s:', await evaluate(ws, `(function(){
    const e = document.querySelector('.hero-slide.active .hero-emoji')
    if (!e) return 'still no emoji'
    const b = e.getBoundingClientRect()
    const s = getComputedStyle(e)
    const sl = document.querySelector('.hero-slide.active').getBoundingClientRect()
    return { emoji: { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height), fontSize: s.fontSize }, slide: { top: Math.round(sl.top), bottom: Math.round(sl.bottom), left: Math.round(sl.left), right: Math.round(sl.right), w: Math.round(sl.width), h: Math.round(sl.height) } }
  })()`))
  ws.close()
  process.exit(0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
