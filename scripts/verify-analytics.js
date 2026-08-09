// Verify analytics tables exist and track endpoint works.
// Usage: node scripts/verify-analytics.js
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '')
}
process.env.SUPABASE_URL = env.SUPABASE_URL
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function check(name, sql) {
  try {
    const { data: _data, error } = await sql()
    if (error) return `FAIL: ${error.message}`
    return 'ok'
  } catch (err) {
    return `ERROR: ${String(err).slice(0, 200)}`
  }
}

async function main() {
  const tables = ['analytics_events', 'analytics_sessions', 'analytics_daily', 'analytics_pages_daily', 'analytics_reports']
  console.log('== Table existence ==')
  for (const t of tables) {
    const res = await check(t, () => db.from(t).select('*', { count: 'exact', head: true }))
    console.log(`  ${t}: ${res}`)
  }

  console.log('== Latest events (if any) ==')
  const { data, error } = await db
    .from('analytics_events')
    .select('event, page, source, device, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) {
    console.log('  query failed:', error.message)
  } else {
    console.log('  rows:', data.length)
    for (const r of data) console.log('  ', r.created_at, r.event, r.page, r.source, r.device)
  }
}

main().then(() => process.exit(0))
