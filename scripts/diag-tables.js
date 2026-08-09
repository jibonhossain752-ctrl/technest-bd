// Diagnostic: why do some analytics tables fail?
const fs = require('fs')
const path = require('path')

const env = {}
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const { createClient } = require('@supabase/supabase-js')
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function probe(name) {
  const { data, error, status, statusText } = await db.from(name).select('*', { head: true, count: 'exact' })
  console.log(name, '=>', JSON.stringify({ status, statusText, error, data }))
}

async function main() {
  for (const t of ['analytics_events', 'analytics_sessions', 'analytics_daily', 'analytics_pages_daily', 'analytics_reports', 'users']) {
    await probe(t)
  }
  console.log('done')
}

main().then(() => process.exit(0))
