import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { getRealtimeSnapshot } from '@/lib/analytics-queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  try {
    const snapshot = await getRealtimeSnapshot()
    return NextResponse.json(snapshot)
  } catch (err) {
    return NextResponse.json(
      { error: 'Analytics query failed.', detail: String(err) },
      { status: 500 },
    )
  }
}
