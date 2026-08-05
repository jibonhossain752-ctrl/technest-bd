export interface PublicUser {
  id: string
  name: string
  email: string
  phone: string
  subscribed: boolean
  createdAt: string
}

export interface AuthResult {
  ok: boolean
  user?: PublicUser
  error?: string
}

const SESSION_KEY = 'technest-session'

export async function registerUser(data: {
  name: string
  email: string
  phone: string
  password: string
  subscribed: boolean
}): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: json?.error ?? 'Could not create your account.' }
    return { ok: true, user: json.user }
  } catch {
    return { ok: false, error: 'Network error. Please try again.' }
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: json?.error ?? 'Could not sign you in.' }
    return { ok: true, user: json.user }
  } catch {
    return { ok: false, error: 'Network error. Please try again.' }
  }
}

export function saveSession(user: PublicUser) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function getSession(): PublicUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as PublicUser) : null
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}
