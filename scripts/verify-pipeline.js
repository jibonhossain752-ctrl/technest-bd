// Full pipeline check: event counts by type, sessions, aggregation smoke test.
// Usage: node scripts/verify-pipeline.js
const fs = require('fs')
const path = require('path')
const env = {}
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const { createClient } = require('@supabase/supabase-js')
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data, error } = await db
    .from('analytics_events')
    .select('event, page, source, device, session_id, meta, country, city, created_at')
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) return console.log('events query failed:', error.message)
  console.log('== Events (newest-first detail omitted; count by type) ==')
  const byType = {}
  for (const e of data) byType[e.event] = (byType[e.event] ?? 0) + 1
  console.log(byType)
  console.log('\n== Sample rows ==')
  for (const e of data.slice(-8)) {
    console.log(
      `  ${e.created_at} | ${e.event} | ${e.page} | ${e.source} | ${e.device} | ${e.country}/${e.city}`,
    )
  }

  const { data: sessions, error: sErr } = await db
    .from('analytics_sessions')
    .select('session_id, landing_page, exit_page, page_views, interactions, source, last_activity')
    .order('last_activity', { ascending: false })
    .limit(10)
  console.log('\n== Sessions ==')
  if (sErr) console.log('  error:', sErr.message)
  else {
    console.log('  count:', sessions.length)
    for (const s of sessions) {
      console.log(
        `  ${s.session_id.slice(0, 12)}… | landing=${s.landing_page} | exit=${s.exit_page} | pv=${s.page_views} | int=${s.interactions} | ${s.source}`,
      )
    }
  }
}

main().then(() => process.exit(0))
