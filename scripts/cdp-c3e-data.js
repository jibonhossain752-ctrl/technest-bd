// Generates real C3/E data: shop searches (+clicks), blog searches (+clicks),
// FAQ expands/category selects, product views + add-to-cart (conversion),
// and Google-attributed /faq visits (via CDP navigate referrer).
// Usage: node scripts/cdp-c3e-data.js  (CDP Edge on 127.0.0.1:9222)
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
  if (msg.exceptionDetails) return 'EXC'
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

async function shopSearch(ws, term) {
  const input = await waitFor(ws, "document.querySelector('.shop-controls input[type=search]')")
  if (!input) return console.log('no shop search input')
  await evaluate(ws, `(function(){ const i = document.querySelector('.shop-controls input[type=search]'); const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(i, ${JSON.stringify(term)}); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return true })()`)
  await sleep(1200)
  const card = await evaluate(ws, `(function(){ const c = document.querySelector('.product-card .product-name'); if (!c) return false; c.click(); return true })()`)
  await sleep(3500)
  return card
}

async function blogSearch(ws, term) {
  const ok = await waitFor(ws, "document.querySelector('.blog-search input')")
  if (!ok) return console.log('no blog search input')
  await evaluate(ws, `(function(){ const i = document.querySelector('.blog-search input'); const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(i, ${JSON.stringify(term)}); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return true })()`)
  await sleep(1200)
  const clicked = await evaluate(ws, `(function(){ const c = document.querySelector('.blog-card a, .blog-card'); if (!c) return false; c.click(); return true })()`)
  await sleep(3500)
  return clicked
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

  // shop searches + clicks
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  await waitFor(ws, "document.querySelector('.product-card')")
  await shopSearch(ws, 'headphones')
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  await waitFor(ws, "document.querySelector('.product-card')")
  await shopSearch(ws, 'sony')
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  await waitFor(ws, "document.querySelector('.product-card')")
  await shopSearch(ws, 'zzzz-nonsense-xyz')
  await send(ws, 'Page.navigate', { url: SITE + '/shop' })
  await waitFor(ws, "document.querySelector('.product-card')")
  await shopSearch(ws, 'webcam')

  // blog searches + click
  await send(ws, 'Page.navigate', { url: SITE + '/blog' })
  await waitFor(ws, "document.querySelector('.blog-card')")
  await blogSearch(ws, 'headphones')
  await send(ws, 'Page.navigate', { url: SITE + '/blog' })
  await waitFor(ws, "document.querySelector('.blog-card')")
  await blogSearch(ws, 'usb-c')

  // FAQ: categories + expands
  await send(ws, 'Page.navigate', { url: SITE + '/faq' })
  await waitFor(ws, "document.querySelector('.faq-question')")
  const cats = ['Payment', 'Delivery', 'Returns']
  for (const c of cats) {
    await evaluate(ws, `(function(){ const b = [...document.querySelectorAll('.faq-filters .chip')].find((x) => x.textContent.trim() === ${JSON.stringify(c)}); if (b) b.click(); return !!b })()`)
    await sleep(600)
  }
  const qs = await evaluate(ws, `(function(){ return [...document.querySelectorAll('.faq-question')].slice(0, 6).map((x) => x.textContent.trim().slice(0, 80)) })()`)
  for (const q of qs || []) {
    await evaluate(ws, `(function(){ const b = [...document.querySelectorAll('.faq-question')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(q.slice(0, 40))})); if (b) b.click(); return !!b })()`)
    await sleep(700)
  }

  // conversions: product views + add-to-cart on two products
  await send(ws, 'Page.navigate', { url: SITE + '/product/kids-echo-dot-5th-gen-owl' })
  await waitFor(ws, "document.querySelector('.add-cart-btn')")
  await evaluate(ws, `document.querySelector('.add-cart-btn').click()`)
  await sleep(1500)
  await send(ws, 'Page.navigate', { url: SITE + '/product/sony-wh-1000xm5-headphones' })
  await waitFor(ws, "document.querySelector('.add-cart-btn')")
  await evaluate(ws, `document.querySelector('.add-cart-btn').click()`)
  await sleep(1500)

  // Google-attributed FAQ visits (referrer proxy)
  await send(ws, 'Page.navigate', { url: SITE + '/faq', referrer: 'https://www.google.com/search?q=technest+payment+methods' })
  await sleep(6000)
  await send(ws, 'Page.navigate', { url: SITE + '/faq', referrer: 'https://www.google.com/search?q=technest+shipping+usa' })
  await sleep(6000)

  ws.close()
  console.log('C3/E data generation done.')
  process.exit(0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
