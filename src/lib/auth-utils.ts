import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const SALT = 'techfix-pro-salt-2024'
const BCRYPT_COST = 12

function isLegacyPasswordHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_COST)
}

export function verifyPassword(password: string, hash: string): boolean {
  if (isLegacyPasswordHash(hash)) {
    return crypto.createHash('sha256').update(password + SALT).digest('hex') === hash
  }

  if (!hash.startsWith('$2')) {
    return false
  }

  try {
    return bcrypt.compareSync(password, hash)
  } catch {
    return false
  }
}

export function shouldUpgradePasswordHash(hash: string): boolean {
  return isLegacyPasswordHash(hash)
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt)
}
