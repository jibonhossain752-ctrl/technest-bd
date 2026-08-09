// Delete the stale empty report from the pre-fix cron run (2026-08-07).
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
  const { data, error } = await db.from('analytics_reports').select('id, date').order('date', { ascending: true })
  if (error) return console.log('query error:', error.message)
  console.log('reports:', data)
  const stale = data.filter((r) => String(r.date) < '2026-08-09')
  for (const r of stale) {
    const { error: delErr } = await db.from('analytics_reports').delete().eq('id', r.id)
    console.log('deleted', r.date, delErr ? 'ERROR ' + delErr.message : 'ok')
  }
}

main().then(() => process.exit(0))
