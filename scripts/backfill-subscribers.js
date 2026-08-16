// Backfill newsletter_subscribers from existing real contacts.
// Run: node scripts/backfill-subscribers.js  (reads .env.local for Supabase creds)
// Seeds ONE row per real registered user who opted into marketing (subscribed=true).
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const { createClient } = require('@supabase/supabase-js')
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  const { data: users, error } = await db
    .from('users')
    .select('email,name,phone,subscribed')
    .eq('subscribed', true)
  if (error) throw error

  const inserted = []
  const skipped = []
  for (const u of users ?? []) {
    const res = await db
      .from('newsletter_subscribers')
      .upsert(
        {
          email: String(u.email).trim().toLowerCase(),
          name: u.name ?? '',
          phone: u.phone ?? '',
          country: '',
          city: '',
          source: 'account',
        },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    if (res.error) throw res.error
    inserted.push(u.email)
  }
  console.log('inserted:', inserted.length)
  inserted.forEach((e) => console.log('  ', e))
}

main().catch((e) => {
  console.error('FATAL', e.message)
  process.exit(1)
})