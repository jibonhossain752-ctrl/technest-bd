import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST() {
  const store = await cookies()
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  try {
    revalidatePath('/', 'layout')
    return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
  } catch (err) {
    console.error('revalidate error', err)
    return NextResponse.json({ error: 'Revalidation failed.' }, { status: 500 })
  }
}