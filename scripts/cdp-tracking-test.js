// End-to-end: navigate headless Edge (CDP) through the live site, then
// confirm events land in Supabase (run scripts/verify-analytics.js after).
// Usage: node scripts/cdp-tracking-test.js
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, method = 'GET') {
  const res = await fetch(url, { method })
  return res.json()
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

async function main() {
  // new tab (PUT required in modern Chrome)
  let tab
  try {
    tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
  } catch (err) {
    console.log('FAILED to open tab:', String(err))
    process.exit(1)
  }
  const ws = await connect(tab.webSocketDebuggerUrl)
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result)
      pending.delete(msg.id)
    }
  }
  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')
  await send(ws, 'Network.enable')

  const pages = [
    { url: SITE + '/', wait: 9000, label: 'home' },
    { url: SITE + '/product/kids-echo-dot-5th-gen-owl', wait: 5000, label: 'product' },
    { url: SITE + '/blog/best-noise-canceling-headphones', wait: 5000, label: 'blog post' },
    { url: SITE + '/definitely-not-a-real-page-xyz', wait: 5000, label: '404' },
  ]

  for (const p of pages) {
    console.log(`\nNavigating: ${p.label} (${p.url})`)
    await send(ws, 'Page.navigate', { url: p.url })
    await sleep(p.wait)
    const { result } = await send(ws, 'Runtime.evaluate', {
      expression: 'window.location.pathname',
      returnByValue: true,
    })
    console.log('  loaded pathname:', result && result.result ? result.result.value : '?')
  }

  ws.close()
  console.log('\nDone. Now check scripts/verify-analytics.js output for event rows.')
  process.exit(0)
}

main().catch((err) => {
  console.error('cdp test error:', err)
  process.exit(1)
})
