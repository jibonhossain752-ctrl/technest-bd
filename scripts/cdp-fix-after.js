// Verifies AFTER state of the four fixes:
//   1. summary-buy-link white text (desktop + mobile)
//   2. desktop checkout: left column fills to right column height, sticky summary
//   3. mobile hero: horizontal text-left/image-right, no float animation
//   4. toast: 3000ms, clickable -> /cart
// Usage: node scripts/cdp-fix-after.js  (CDP Edge on 127.0.0.1:9222)
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
async function waitFor(ws, expr, timeout = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if ((await evaluate(ws, `!!(${expr})`)) === true) return true
    await sleep(400)
  }
  return false
}
async function setMetrics(ws, w, h, mobile) {
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 2, mobile,
    screenWidth: w, screenHeight: h,
  })
}
const CART = [
  { slug: 'rayneo-air-4-pro-batman-justice', qty: 1 },
  { slug: 'kids-echo-dot-5th-gen-owl', qty: 2 },
  { slug: 'samsung-galaxy-z-flip8-256gb', qty: 1 },
]
const CHECKOUT_PROBE = `(function(){
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width) } }
  const sb = document.querySelector('.summary-buy-link')
  const sbs = sb ? getComputedStyle(sb) : null
  const sum = document.querySelector('.cart-summary')
  return {
    btnText: sb ? sb.textContent.trim() : null,
    btnColor: sbs ? sbs.color : null,
    btnBg: sbs ? sbs.backgroundColor : null,
    main: r(document.querySelector('.checkout-main')),
    summary: r(sum),
    summaryPos: sum ? getComputedStyle(sum).position : null,
    gap: (function(){ const m = document.querySelector('.checkout-main').getBoundingClientRect(); const s = sum.getBoundingClientRect(); return s.bottom - m.bottom })()
  }
})()`
const HERO_PROBE = `(function(){
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) } }
  const inner = document.querySelector('.hero-static-inner')
  const text = document.querySelector('.hero-static-text')
  const imgWrap = document.querySelector('.hero-static-img')
  const cols = inner ? getComputedStyle(inner).gridTemplateColumns : null
  const anim = imgWrap ? getComputedStyle(imgWrap).animationName : null
  return { cols, anim, text: r(text), img: r(imgWrap), imgRightHalf: imgWrap ? imgWrap.getBoundingClientRect().left > window.innerWidth / 2 : null }
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

  // --- desktop checkout ---
  await setMetrics(ws, 1440, 900, false)
  await send(ws, 'Page.navigate', { url: SITE + '/checkout' })
  await waitFor(ws, "document.querySelector('.summary-buy-link')")
  await evaluate(ws, `localStorage.setItem('technest-cart', ${JSON.stringify(JSON.stringify(CART))})`)
  await send(ws, 'Page.navigate', { url: SITE + '/checkout' })
  await waitFor(ws, "document.querySelector('.summary-buy-link')")
  await sleep(1200)
  console.log('desktop checkout:', JSON.stringify(await evaluate(ws, CHECKOUT_PROBE), null, 2))

  // --- mobile checkout ---
  await setMetrics(ws, 390, 844, true)
  await send(ws, 'Page.navigate', { url: SITE + '/checkout' })
  await waitFor(ws, "document.querySelector('.summary-buy-link')")
  await sleep(1200)
  console.log('mobile checkout:', JSON.stringify(await evaluate(ws, CHECKOUT_PROBE), null, 2))

  // --- mobile hero ---
  await send(ws, 'Page.navigate', { url: SITE + '/' })
  await waitFor(ws, "document.querySelector('.hero-static-img-el')")
  await sleep(1500)
  console.log('mobile hero:', JSON.stringify(await evaluate(ws, HERO_PROBE), null, 2))

  // --- toast: timing + click navigation ---
  await send(ws, 'Page.navigate', { url: SITE + '/product/kids-echo-dot-5th-gen-owl' })
  await waitFor(ws, "document.querySelector('.add-cart-btn')")
  await sleep(1000)
  await evaluate(ws, `document.querySelector('.add-cart-btn').click()`)
  const t0 = Date.now()
  let firstSeen = null, lastSeen = null
  while (Date.now() - t0 < 5000) {
    const vis = await evaluate(ws, `!!document.querySelector('.toast.show')`)
    if (vis === true) { if (firstSeen === null) firstSeen = Date.now(); lastSeen = Date.now() }
    await sleep(120)
  }
  console.log(`toast duration: ${lastSeen && firstSeen ? lastSeen - firstSeen : '-'}ms`)
  console.log('toast tag:', await evaluate(ws, `document.querySelector('.toast') ? document.querySelector('.toast').tagName + '|' + (document.querySelector('.toast a') ? 'nested-a' : 'is-link') : 'gone'`))
  const clickRes = await evaluate(ws, `(function(){ const t = document.querySelector('.toast'); if (!t) return 'no toast'; t.click(); return 'clicked' })()`)
  console.log('toast click:', clickRes)
  await sleep(1800)
  console.log('after click url:', await evaluate(ws, `location.pathname`))

  ws.close()
  process.exit(0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
