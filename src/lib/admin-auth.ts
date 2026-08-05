import { createHmac, timingSafeEqual } from 'crypto'
import { verifySecret } from './passwords'

export const ADMIN_COOKIE = 'tn_admin_session'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

function secret(): string {
  const s = process.env.ADMIN_COOKIE_SECRET
  if (!s) throw new Error('ADMIN_COOKIE_SECRET is not configured.')
  return s
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminHash = process.env.ADMIN_PASSWORD_HASH
  if (!adminEmail || !adminHash) return false
  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) return false
  return verifySecret(password, adminHash)
}

export function signSessionToken(): string {
  const payload = {
    sub: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret())
    .update(body)
    .digest('base64url')
  return `${body}.${sig}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  if (!safeEqual(sig, expected)) return false
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as { sub?: string; exp?: number }
    if (payload.sub !== 'admin') return false
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
