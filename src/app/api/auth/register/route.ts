import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'
import { hashSecret } from '@/lib/passwords'
import type { PublicUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: {
    name?: string
    email?: string
    phone?: string
    password?: string
    subscribed?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name = body.name?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const phone = body.phone?.trim() ?? ''
  const password = body.password ?? ''
  const subscribed = Boolean(body.subscribed)

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Name, email and password are required.' },
      { status: 400 },
    )
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters.' },
      { status: 400 },
    )
  }

  try {
    const db = getDb()
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    const { data, error } = await db
      .from('users')
      .insert({
        name,
        email,
        phone,
        password_hash: hashSecret(password),
        subscribed,
      })
      .select('id, name, email, phone, subscribed, created_at')
      .single()

    if (error) throw error

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
    console.error('register error', err)
    return NextResponse.json(
      { error: 'Could not create your account. Please try again.' },
      { status: 500 },
    )
  }
}
