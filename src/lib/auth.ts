export interface StoredUser {
  id: string
  name: string
  email: string
  phone: string
  passwordHash: string
  subscribed: boolean
  createdAt: string
}

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

const USERS_KEY = 'technest-users'
const SESSION_KEY = 'technest-session'

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/**
 * Demo-only deterministic hash. NOT cryptographically secure — replace with
 * a real backend (Supabase/Firebase/etc.) before handling real users.
 */
export function hashPassword(password: string): string {
  const salted = `technest::${password}`
  let hash = 5381
  for (let i = 0; i < salted.length; i++) {
    hash = ((hash << 5) + hash + salted.charCodeAt(i)) | 0
  }
  return `h${(hash >>> 0).toString(16)}`
}

function toPublic(user: StoredUser): PublicUser {
  const { passwordHash: _pw, ...rest } = user
  return rest
}

export function registerUser(data: {
  name: string
  email: string
  phone: string
  password: string
  subscribed: boolean
}): AuthResult {
  const users = readUsers()
  const email = data.email.trim().toLowerCase()
  if (!email || !data.password) {
    return { ok: false, error: 'Email and password are required.' }
  }
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }
  const user: StoredUser = {
    id: `u-${Date.now()}`,
    name: data.name.trim(),
    email,
    phone: data.phone.trim(),
    passwordHash: hashPassword(data.password),
    subscribed: data.subscribed,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  writeUsers(users)
  return { ok: true, user: toPublic(user) }
}

export function loginUser(email: string, password: string): AuthResult {
  const users = readUsers()
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  )
  if (!user) {
    return { ok: false, error: 'No account found with this email.' }
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Incorrect password. Please try again.' }
  }
  return { ok: true, user: toPublic(user) }
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
