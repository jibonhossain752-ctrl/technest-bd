// Captures BEFORE state of the two fix prompts:
//   1. checkout 'Buy on Amazon' button visibility + desktop layout balance
//   2. hero banner emoji position on mobile + toast duration/clickability
// Usage: node scripts/cdp-fix-before.js  (CDP Edge must be on 127.0.0.1:9222)
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const fs = require('fs')
const path = require('path')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const SHOTS = path.join(__dirname, 'shots')
fs.mkdirSync(SHOTS, { recursive: true })

async function getJson(url, method = 'GET') {
  return (await fetch(url, { method })).json()
}
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
  if (!msg.result) return 'NO-RESULT: ' + JSON.stringify(msg).slice(0, 120)
  return msg.result.value
}
async function waitFor(ws, expr, timeout = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    const v = await evaluate(ws, `!!(${expr})`)
    if (v === true) return true
    await sleep(400)
  }
  return false
}
async function shot(ws, name) {
  const { data } = await send(ws, 'Page.captureScreenshot', { format: 'png' })
  const file = path.join(SHOTS, name)
  fs.writeFileSync(file, Buffer.from(data, 'base64'))
  console.log('  shot ->', file)
}
async function setMetrics(ws, w, h, mobile) {
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 2,
    mobile, screenWidth: w, screenHeight: h,
  })
}
const CART = [
  { slug: 'rayneo-air-4-pro-batman-justice', qty: 1 },
  { slug: 'kids-echo-dot-5th-gen-owl', qty: 2 },
  { slug: 'samsung-galaxy-z-flip8-256gb', qty: 1 },
]
async function seedCart(ws) {
  return evaluate(ws, `localStorage.setItem('technest-cart', ${JSON.stringify(JSON.stringify(CART))})`)
}
const BTN_INFO = `(function(){
  const out = {}
  const sb = document.querySelector('.summary-buy-link')
  if (sb) { const s = getComputedStyle(sb); out.summaryBuyLink = { text: sb.textContent.trim(), color: s.color, bg: s.backgroundColor } }
  const ba = document.querySelector('.buy-all')
  if (ba) { const s = getComputedStyle(ba); out.buyAll = { text: ba.textContent.trim(), color: s.color, bg: s.backgroundColor } }
  return out
})()`
const LAYOUT = `(function(){
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height), width: Math.round(b.width) } }
  return {
    checkout: r(document.querySelector('.checkout')),
    main: r(document.querySelector('.checkout-main')),
    summary: r(document.querySelector('.cart-summary')),
    bodyScrollH: document.body.scrollHeight,
  }
})()`

async function checkoutInspect(ws, tag) {
  await seedCart(ws)
  await send(ws, 'Page.navigate', { url: SITE + '/checkout' })
  await waitFor(ws, "document.querySelector('.summary-buy-link')")
  await sleep(1000)
  const info = await evaluate(ws, BTN_INFO)
  const lay = await evaluate(ws, LAYOUT)
  console.log(`\n[${tag}] buttons:`, JSON.stringify(info, null, 2))
  console.log(`[${tag}] layout:`, JSON.stringify(lay, null, 2))
  await shot(ws, `before-${tag}-checkout.png`)
}

async function heroInspect(ws, tag) {
  await send(ws, 'Page.navigate', { url: SITE + '/' })
  await waitFor(ws, "document.querySelector('.hero-slide.active')")
  await sleep(1500)
  const emoji = await evaluate(ws, `(function(){
    const e = document.querySelector('.hero-slide.active .hero-emoji')
    if (!e) return 'no emoji'
    const b = e.getBoundingClientRect()
    const s = getComputedStyle(e)
    const sl = document.querySelector('.hero-slide.active').getBoundingClientRect()
    return { emoji: { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height), fontSize: s.fontSize }, slide: { top: Math.round(sl.top), bottom: Math.round(sl.bottom), left: Math.round(sl.left), right: Math.round(sl.right), w: Math.round(sl.width), h: Math.round(sl.height) } }
  })()`)
  console.log(`\n[${tag}] hero:`, JSON.stringify(emoji, null, 2))
  await shot(ws, `before-${tag}-hero.png`)
}

async function toastInspect(ws) {
  await send(ws, 'Page.navigate', { url: SITE + '/product/kids-echo-dot-5th-gen-owl' })
  await waitFor(ws, "document.querySelector('.add-cart-btn')")
  await sleep(1000)
  const clicked = await evaluate(ws, `(function(){ const b = document.querySelector('.add-cart-btn'); if (!b) return 'no btn'; b.click(); return 'clicked' })()`)
  console.log('\n[toast] add-to-cart:', clicked)
  const t0 = Date.now()
  let firstSeen = null, lastSeen = null
  while (Date.now() - t0 < 5000) {
    const vis = await evaluate(ws, `!!document.querySelector('.toast.show')`)
    if (vis === true) { if (firstSeen === null) firstSeen = Date.now(); lastSeen = Date.now() }
    await sleep(120)
  }
  const dur = lastSeen && firstSeen ? lastSeen - firstSeen : null
  console.log(`[toast] duration: ${dur}ms (firstSeen ${firstSeen ? firstSeen - t0 : '-'}ms, lastSeen ${lastSeen ? lastSeen - t0 : '-'}ms)`)
  const clickable = await evaluate(ws, `(function(){ const t = document.querySelector('.toast'); if (!t) return 'no toast'; const p = t.tagName + '|' + (t.querySelector('a') ? 'has-link' : 'no-link'); t.click(); return 'clicked ' + p + ', url=' + location.pathname })()`)
  console.log('[toast] click test:', clickable)
  await shot(ws, 'before-toast.png')
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

  await setMetrics(ws, 1440, 900, false)
  await heroInspect(ws, 'desktop')
  await checkoutInspect(ws, 'desktop')
  await toastInspect(ws)

  await setMetrics(ws, 390, 844, true)
  await heroInspect(ws, 'mobile')
  await checkoutInspect(ws, 'mobile')

  ws.close()
  console.log('\nBEFORE capture done.')
  process.exit(0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
