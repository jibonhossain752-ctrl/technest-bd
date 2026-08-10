// Check time_on_page dedupe collapse: two tabs closed -> expect exactly 2 rows
// (1 per tab: pagehide + visibilitychange collapsed by the 2s dedupe).
const fs = require('fs')
const env = {}
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=')
  if (line.startsWith('#') || i < 0) continue
  env[line.slice(0, i)] = line.slice(i + 1)
}
const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
const url = `${env.SUPABASE_URL}/rest/v1/analytics_events?select=session_id,event,created_at&event=eq.time_on_page&created_at=gte.${since}&order=created_at.desc`
fetch(url, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } })
  .then((r) => r.json())
  .then((rows) => {
    const bySession = {}
    for (const r of rows) bySession[r.session_id] = (bySession[r.session_id] ?? 0) + 1
    console.log('time_on_page rows (10 min):', rows.length, '| per session:', JSON.stringify(bySession))
  })
  .catch((e) => { console.error(e); process.exit(1) })
