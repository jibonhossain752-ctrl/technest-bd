// Log in to /admin, open /admin/analytics, dump key UI facts + screenshot.
// Usage: $env:ADMIN_EMAIL='...'; $env:ADMIN_PASSWORD='...'; node scripts/cdp-admin-check.js
const fs = require('fs')
const path = require('path')
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const OUT = path.join(process.env.TEMP || 'C:/Users/User/AppData/Local/Temp', 'opencode', 'admin-analytics.png')

const EMAIL = process.env.ADMIN_EMAIL
const PASSWORD = process.env.ADMIN_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error('ADMIN_EMAIL/ADMIN_PASSWORD env vars required')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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

const SET_VALUE = (selector, value) =>
  `(function(){
    const el = document.querySelector('${selector}')
    if (!el) return 'missing:' + '${selector}'
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, ${JSON.stringify(value)})
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return 'set'
  })()`

async function main() {
  const tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
  const ws = await connect(tab.webSocketDebuggerUrl)
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result)
      pending.delete(msg.id)
    }
  }
  const ev = async (expression) => {
    const res = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (res.exceptionDetails) return 'EXCEPTION ' + JSON.stringify(res.exceptionDetails).slice(0, 200)
    return res.result ? res.result.value : undefined
  }

  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')
  await send(ws, 'Network.enable')

  console.log('1. open /admin/login')
  await send(ws, 'Page.navigate', { url: SITE + '/admin/login' })
  await sleep(4000)

  console.log('2. fill email+password')
  console.log('  email:', await ev(SET_VALUE('#admin-email', EMAIL)))
  console.log('  password:', await ev(SET_VALUE('#admin-password', PASSWORD)))

  console.log('3. submit')
  await ev(`(function(){const f=document.querySelector('form.checkout-form');if(!f)return 'no form';f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return 'submitted'})()`)
  await sleep(5000)
  console.log('  path after submit:', await ev('window.location.pathname'))

  console.log('4. navigate to /admin/analytics')
  await send(ws, 'Page.navigate', { url: SITE + '/admin/analytics?range=7' })
  await sleep(8000)

  const facts = await ev(`(function(){
    const txt = (s) => (document.querySelector(s) ? document.querySelector(s).textContent.trim() : null)
    return {
      path: window.location.pathname,
      title: txt('.admin-title'),
      rangeTabs: document.querySelectorAll('.an-range-tab').length,
      sections: [...document.querySelectorAll('.an-section h2')].map(h => h.textContent),
      cards: [...document.querySelectorAll('.an-cards .admin-card strong')].map(s => s.textContent),
      productRows: document.querySelectorAll('table.admin-table').length,
      firstTableRows: document.querySelector('table.admin-table') ? document.querySelectorAll('table.admin-table tbody tr').length : 0,
      realtime: !!document.querySelector('.an-realtime'),
      realtimeText: txt('.an-realtime-stats'),
      emptyMessages: [...document.querySelectorAll('.an-empty')].map(e => e.textContent.slice(0, 40)),
    }
  })()`)
  console.log('dashboard facts:', JSON.stringify(facts, null, 2))

  console.log('5. screenshot ->', OUT)
  const shot = await send(ws, 'Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
  console.log('  screenshot saved')

  ws.close()
  process.exit(0)
}

main().catch((e) => {
  console.error('admin check error:', e)
  process.exit(1)
})
