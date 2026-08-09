// What does /admin/analytics do for an unauthenticated browser?
const SITE = 'https://technest-bd.vercel.app'
const CDP = 'http://127.0.0.1:9222'
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
const responses = []
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((resolve) => {
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function main() {
  const tab = await getJson(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, 'PUT')
  const ws = await connect(tab.webSocketDebuggerUrl)
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.method === 'Network.responseReceived') {
      responses.push({
        status: msg.params.response.status,
        url: msg.params.response.url,
        location: msg.params.response.headers['location'] ?? null,
      })
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result)
      pending.delete(msg.id)
    }
  }
  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')
  await send(ws, 'Network.enable')

  await send(ws, 'Page.navigate', { url: SITE + '/admin/analytics' })
  await sleep(7000)

  const evalRes = await send(ws, 'Runtime.evaluate', {
    expression: `(function(){
      return {
        path: window.location.pathname,
        hasRangeTabs: !!document.querySelector('.an-range-tabs'),
        h1: document.querySelector('.admin-title') ? document.querySelector('.admin-title').textContent : null,
        bodyStart: document.body.innerText.slice(0, 100)
      }
    })()`,
    returnByValue: true,
  })
  if (evalRes.exceptionDetails) {
    console.log('evaluate exception:', JSON.stringify(evalRes.exceptionDetails).slice(0, 400))
  } else {
    console.log('final state:', JSON.stringify(evalRes.result.value, null, 2))
  }
  console.log('network responses:')
  for (const r of responses) console.log('  ', r.status, r.url, r.location ? '-> ' + r.location : '')
  ws.close()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
