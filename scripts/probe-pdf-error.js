// Fetch one PDF export and print the error body.
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
  if (msg.exceptionDetails) return 'EXC'
  return msg.result ? msg.result.value : undefined
}
async function main() {
  const tab = await getJson(CDP + '/json/new?' + encodeURIComponent('about:blank'), 'PUT')
  const ws = await new Promise((resolve, reject) => { const w = new WebSocket(tab.webSocketDebuggerUrl); w.onopen = () => resolve(w); w.onerror = reject })
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
  await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable'); await send(ws, 'Network.enable')
  await send(ws, 'Page.navigate', { url: SITE + '/admin/login' })
  await sleep(3500)
  await evaluate(ws, `(function(){
    const set = (sel, v) => { const i = document.querySelector(sel); if (i) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })) } }
    set('input[type=email], input[name=email], input[type=text]', ${JSON.stringify(env.ADMIN_EMAIL)})
    set('input[type=password]', ${JSON.stringify(env.ADMIN_PASSWORD)})
    return true
  })()`)
  await sleep(500)
  await evaluate(ws, `(function(){ const b = document.querySelector('form button[type=submit]') || document.querySelector('button.btn'); if (b) b.click(); return !!b })()`)
  await sleep(2500)
  const ck = await send(ws, 'Network.getCookies', { urls: [SITE] })
  const cookie = (ck.cookies || []).map((c) => c.name + '=' + c.value).find((c) => c.startsWith('tn_admin_session='))
  ws.close()
  const res = await fetch(SITE + '/api/admin/analytics/export?range=7&scope=daily&format=pdf', { headers: { cookie } })
  console.log('status:', res.status)
  console.log('body:', (await res.text()).slice(0, 2000))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
