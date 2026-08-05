import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'
import { verifySecret } from '@/lib/passwords'
import type { PublicUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 },
    )
  }

  try {
    const db = getDb()
    const { data, error } = await db
      .from('users')
      .select('id, name, email, phone, password_hash, subscribed, created_at')
      .eq('email', email)
      .maybeSingle()
    if (error) throw error
    if (!data || !verifySecret(password, data.password_hash)) {
      return NextResponse.json(
        { error: 'No account found with these credentials.' },
        { status: 401 },
      )
    }

    const user: PublicUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      subscribed: data.subscribed,
      createdAt: data.created_at,
    }
    return NextResponse.json({ user })
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json(
      { error: 'Could not sign you in. Please try again.' },
      { status: 500 },
    )
  }
}
