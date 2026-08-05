import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function hashSecret(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifySecret(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const actual = scryptSync(password, salt, 64)
  const expectedBuf = Buffer.from(expected, 'hex')
  return (
    actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf)
  )
}
