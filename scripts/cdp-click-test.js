// Click-through test: shop → add to cart → buy now → cart → checkout.
// Verifies B2 events end to end. Run scripts/verify-pipeline.js after.
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
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((resolve) => {
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(ws, expression) {
  const { result } = await send(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
  })
  return result && result.result ? result.result.value : undefined
}

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
  await send(ws, 'Page.enable')
  await send(ws, 'Runtime.enable')

  const nav = async (url, wait) => {
    await send(ws, 'Page.navigate', { url })
    await sleep(wait)
  }

  console.log('1. open /shop')
  await nav(SITE + '/shop', 6000)

  console.log('2. click first Add to Cart')
  const clicked1 = await evaluate(
    ws,
    `(function(){const b=document.querySelector('.product-card .add-cart');if(!b)return 'no button';b.click();return 'clicked'})()`,
  )
  console.log('   ->', clicked1)
  await sleep(2500)

  console.log('3. click first Buy Now link (affiliate)')
  const clicked2 = await evaluate(
    ws,
    `(function(){const b=document.querySelector('.product-card .buy-now');if(!b)return 'no button';b.click();return 'clicked ' + b.textContent.trim()})()`,
  )
  console.log('   ->', clicked2)
  await sleep(3500)

  console.log('4. go to /cart')
  await nav(SITE + '/cart', 4000)

  console.log('5. go to /checkout')
  await nav(SITE + '/checkout', 5000)

  console.log('6. open a product page (product_view)')
  await nav(SITE + '/product/rayneo-air-4-pro-batman-justice', 5000)

  ws.close()
  console.log('\nclick-through done — check events in DB.')
  process.exit(0)
}

main().catch((err) => {
  console.error('error:', err)
  process.exit(1)
})
