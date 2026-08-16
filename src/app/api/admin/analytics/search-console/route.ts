import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import {
  getSearchConsoleSnapshot,
  syncSearchConsoleSnapshot,
  gscEnvPresent,
} from '@/lib/search-console'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REFRESH_COOLDOWN_MS = 15 * 60 * 1000

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
}

async function authed() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  return verifySessionToken(token)
}

// Read the cached snapshot — never touches the Google API.
export async function GET() {
  if (!(await authed())) return unauthorized()
  try {
    const { snapshot, lastError: cachedError } =
      await getSearchConsoleSnapshot()
    return NextResponse.json({
      snapshot,
      lastError: cachedError,
      configured: gscEnvPresent(),
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Search Console cache query failed.', detail: String(err) },
      { status: 500 },
    )
  }
}

// Manual refresh: fetch from Google and cache. Rate-limited to one run per
// 15 minutes so a misbehaving client can't burn the daily API quota.
export async function POST() {
  if (!(await authed())) return unauthorized()
  try {
    const { snapshot } = await getSearchConsoleSnapshot()
    if (snapshot && snapshot.fetched_at) {
      const age = Date.now() - new Date(snapshot.fetched_at).getTime()
      if (age < REFRESH_COOLDOWN_MS) {
        const mins = Math.ceil(
          (REFRESH_COOLDOWN_MS - age) / 60000,
        )
        return NextResponse.json(
          { error: `Too soon. Search Console data was just refreshed — try again in ~${mins} min.` },
          { status: 429 },
        )
      }
    }
    const result = await syncSearchConsoleSnapshot()
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error?.message ?? 'Sync failed.', kind: result.error?.kind },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: true, fetchedAt: result.snapshot?.fetched_at })
  } catch (err) {
    return NextResponse.json(
      { error: 'Search Console sync failed.', detail: String(err) },
      { status: 500 },
    )
  }
}
