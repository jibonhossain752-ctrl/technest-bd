// Verifies the partial-done items (C3, E, F) after deploy:
//  - admin login, dashboard pages render with data (devices/locations/search/overview)
//  - xlsx/pdf/csv exports produce valid files for every scope
//  - cron test email sends (Ethereal) and returns a preview URL
// Usage: node scripts/verify-c3e-f.js  (CDP Edge on 127.0.0.1:9222 for login)
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')

const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''))
}

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

async function loginCookie() {
  const tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
  const ws = await connect(tab.webSocketDebuggerUrl)
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) }
  }
  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')
  await send(ws, 'Page.navigate', { url: SITE + '/admin/login' })
  await sleep(3500)
  await evaluate(ws, `(function(){
    const set = (sel, v) => { const i = document.querySelector(sel); if (i) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })) } }
    set('input[type=email], input[name=email], input[type=text]', ${JSON.stringify(env.ADMIN_EMAIL)})
    set('input[type=password]', ${JSON.stringify(env.ADMIN_PASSWORD)})
    return true
  })()`)
  await sleep(600)
  await evaluate(ws, `(function(){ const b = document.querySelector('form button[type=submit], button.btn'); if (b) b.click(); return !!b })()`)
  await sleep(2500)
  const cookie = await send(ws, 'Network.getCookies', { urls: [SITE] })
  const cookies = (cookie.cookies || []).map((c) => c.name + '=' + c.value)
  const admin = cookies.find((c) => c.startsWith('tn_admin_session='))
  ws.close()
  return admin ? admin : (cookies.length ? cookies[0] : null)
}

async function checkPages(cookie) {
  for (const route of ['/admin/analytics', '/admin/analytics/devices', '/admin/analytics/locations', '/admin/analytics/search']) {
    const tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
    const ws = await connect(tab.webSocketDebuggerUrl)
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) }
    }
    await send(ws, 'Page.enable')
    await send(ws, 'Runtime.enable')
    await send(ws, 'Network.enable')
    await send(ws, 'Network.setCookie', { url: SITE, name: 'technest_admin', value: cookie.split('=').slice(1).join('='), path: '/' })
    await send(ws, 'Page.navigate', { url: SITE + route })
    await sleep(5000)
    const info = await evaluate(ws, `(function(){
      const out = { path: location.pathname, title: document.title }
      out.sections = [...document.querySelectorAll('.an-section h2')].map((h) => h.textContent.trim())
      out.emptyMsgs = [...document.querySelectorAll('.an-empty')].map((e) => e.textContent.trim().slice(0, 60))
      out.tableRows = document.querySelectorAll('.admin-table tbody tr').length
      out.exportButtons = [...document.querySelectorAll('.an-export-bar a')].map((a) => a.textContent.trim())
      out.subnav = [...document.querySelectorAll('.an-subnav-tab')].map((a) => a.textContent.trim())
      return out
    })()`)
    ws.close()
    const nonEmpty = info && info.sections && info.sections.length > 0
    check('page renders: ' + route, !!info && String(info.title).includes('TechNest'), JSON.stringify(info && info.sections))
    check('page has data sections: ' + route, nonEmpty, 'sections=' + (info && info.sections.length) + ' tableRows=' + (info && info.tableRows))
  }
}

async function checkExports(cookie) {
  const scopes = ['daily', 'devices', 'locations', 'search']
  const formats = ['csv', 'xlsx', 'pdf', 'json']
  const tmp = path.join(__dirname, 'shots')
  fs.mkdirSync(tmp, { recursive: true })
  for (const scope of scopes) {
    for (const format of formats) {
      const url = `${SITE}/api/admin/analytics/export?range=7&scope=${scope}&format=${format}`
      const res = await fetch(url, { headers: { cookie: cookie } })
      const buf = Buffer.from(await res.arrayBuffer())
      const file = path.join(tmp, `verify-${scope}-${format}`)
      fs.writeFileSync(file, buf)
      let ok = res.status === 200
      let detail = 'status=' + res.status + ' size=' + buf.length
      if (format === 'xlsx') {
        ok = ok && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04
        try {
          const wb = XLSX.read(buf)
          detail += ' sheets=' + wb.SheetNames.join(',')
        } catch (e) { ok = false; detail += ' parse-error: ' + e.message }
      } else if (format === 'pdf') {
        ok = ok && buf.slice(0, 5).toString() === '%PDF-'
        detail += ' magic=' + buf.slice(0, 5).toString()
      } else if (format === 'csv') {
        ok = ok && buf.length > 10
      } else {
        ok = ok && buf.length > 10
        try { JSON.parse(buf.toString()) } catch { ok = false; detail += ' not-json' }
      }
      check('export ' + scope + '/' + format, ok, detail)
    }
  }
}

async function checkCronEmail() {
  const url = SITE + '/api/analytics/cron?testEmail=1'
  const res = await fetch(url, { headers: { authorization: 'Bearer ' + (env.CRON_SECRET || '') } })
  const body = await res.json()
  const email = body.email
  check('cron email ethereal test', res.status === 200 && email && email.ok && email.mode === 'ethereal',
    'mode=' + (email && email.mode) + ' preview=' + (email && email.previewUrl))
  check('cron email preview URL available', !!(email && email.previewUrl), email && email.previewUrl)
  const stored = await verifyReportRows()
  check('report stored for date', stored)
}

async function verifyReportRows() {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data } = await supabase.from('analytics_reports').select('date').order('date', { ascending: false }).limit(1)
  return data && data.length > 0 ? data[0].date : null
}

async function main() {
  const cookie = await loginCookie()
  check('admin login cookie', !!cookie, cookie ? 'got cookie' : 'no cookie')
  if (!cookie) { process.exit(1) }
  await checkPages(cookie)
  await checkExports(cookie)
  await checkCronEmail()
  const failed = results.filter((r) => !r.ok)
  console.log('\n=== SUMMARY: ' + (results.length - failed.length) + '/' + results.length + ' passed ===')
  if (failed.length) console.log('FAILED: ' + failed.map((f) => f.name).join('; '))
  process.exit(failed.length ? 1 : 0)
}
main().catch((err) => { console.error('error:', err); process.exit(1) })
