import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  signSessionToken,
  verifyAdminCredentials,
} from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = body.email?.trim() ?? ''
  const password = body.password ?? ''

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, signSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
  return res
}
