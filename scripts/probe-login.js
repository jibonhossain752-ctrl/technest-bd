// Isolated login probe: dump field values + POST body after injection.
const fs = require('fs')
const path = require('path')
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}
const getJson = (url, method = 'GET') => fetch(url, { method }).then((r) => r.json())
let msgId = 0
const pending = new Map()
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((res) => { pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
}
async function evaluate(ws, expression) {
  const msg = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  if (msg.exceptionDetails) return 'EXC:' + (msg.exceptionDetails.text || '')
  return msg.result ? msg.result.value : undefined
}
async function main() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((res, rej) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => res(w); w.onerror = rej })
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable'); await send(ws, 'Network.enable')
  let lastBody = null
  ws.onmessage = null
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('/api/admin/login')) {
      lastBody = m.params.request.postData
    }
  }
  await send(ws, 'Page.navigate', { url: SITE + '/admin/login' })
  await sleep(4000)
  await evaluate(ws, `(function(){
    const set = (sel, v) => { const i = document.querySelector(sel); if (i) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })) } }
    set('#admin-email', ${JSON.stringify(env.ADMIN_EMAIL)})
    set('#admin-password', ${JSON.stringify(env.ADMIN_PASSWORD)})
    return true
  })()`)
  await sleep(800)
  const vals = await evaluate(ws, "JSON.stringify({ email: document.querySelector('#admin-email').value, pw: document.querySelector('#admin-password').value, envEmail: 'REDACTED' })")
  console.log('input values after set:', vals)
  await evaluate(ws, "document.querySelector('form').requestSubmit()")
  await sleep(3500)
  const res = await evaluate(ws, "document.body.innerText.includes('Invalid credentials') ? 'INVALID' : document.body.innerText.slice(0, 120)")
  console.log('after submit:', res)
  console.log('POST body sent:', lastBody ? lastBody.replace(/"[^"]{8,}"/g, '"<redacted>"') : 'NONE')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
