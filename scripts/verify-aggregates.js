// Check aggregation outputs: analytics_daily + analytics_reports.
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
  const { data: daily, error: dErr } = await db
    .from('analytics_daily')
    .select('*')
    .order('date', { ascending: false })
    .limit(5)
  console.log('== analytics_daily ==')
  if (dErr) console.log(' error:', dErr.message)
  else {
    console.log(' rows:', daily.length)
    for (const r of daily) {
      console.log(
        `  ${r.date} | ${r.source} | ${r.device} | ${r.country} | visitors=${r.visitors} pv=${r.page_views} sessions=${r.sessions} clicks=${r.affiliate_clicks} atc=${r.add_to_cart} subs=${r.newsletter_subscribes} shown=${r.newsletter_shown}`,
      )
    }
  }

  const { data: pages, error: pErr } = await db
    .from('analytics_pages_daily')
    .select('*')
    .order('views', { ascending: false })
    .limit(10)
  console.log('\n== analytics_pages_daily ==')
  if (pErr) console.log(' error:', pErr.message)
  else {
    console.log(' rows:', pages.length)
    for (const r of pages) {
      console.log(`  ${r.date} | ${r.page} | views=${r.views} unique=${r.unique_views} time=${r.time_on_page_seconds}s exits=${r.exits} ref=${r.referral_hits}`)
    }
  }

  const { data: reports, error: rErr } = await db
    .from('analytics_reports')
    .select('date, created_at, payload')
    .order('date', { ascending: false })
    .limit(5)
  console.log('\n== analytics_reports ==')
  if (rErr) console.log(' error:', rErr.message)
  else {
    console.log(' rows:', reports.length)
    for (const r of reports) {
      const p = r.payload || {}
      console.log(`  ${r.date} | visitors=${p.visitors} pv=${p.page_views} sessions=${p.sessions} clicks=${p.affiliate_clicks} atc=${p.add_to_cart} subs=${p.newsletter_subscribes}`)
    }
  }
}

main().then(() => process.exit(0))
