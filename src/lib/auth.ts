import { db } from '@/lib/db'
import { ensureDatabaseReady } from '@/lib/bootstrap'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'
import { SESSION_HEADER, SESSION_STORAGE_KEY } from './session'

export const SESSION_COOKIE = 'akuafo_session'
// Re-exported so the rest of the server code keeps a single import source.
// The actual constants live in lib/session.ts (client-safe, no server imports).
export { SESSION_HEADER, SESSION_STORAGE_KEY }

const SESSION_DAYS = 30

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const orig = Buffer.from(hash, 'hex')
  return orig.length === test.length && timingSafeEqual(orig, test)
}

export interface SafeUser {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  sellerType: string | null
  businessName: string | null
  bio: string | null
  identityStatus: string
  verificationNote: string | null
  createdAt: Date
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  sellerType: true,
  businessName: true,
  bio: true,
  identityStatus: true,
  verificationNote: true,
  createdAt: true,
} as const

export function toSafeUser(user: {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  sellerType: string | null
  businessName: string | null
  bio: string | null
  identityStatus: string
  verificationNote: string | null
  createdAt: Date
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    sellerType: user.sellerType,
    businessName: user.businessName,
    bio: user.bio,
    identityStatus: user.identityStatus,
    verificationNote: user.verificationNote,
    createdAt: user.createdAt,
  }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)
  await db.session.create({ data: { token, userId, expiresAt } })
  return { token, expiresAt }
}

// Session cookie policy:
// - HTTPS (behind the gateway): SameSite=None + Secure so the cookie also works
//   when the app is displayed inside a cross-site iframe (the preview panel).
// - Plain HTTP (local dev): SameSite=Lax, no Secure flag.
export function sessionCookieOptions(
  expiresAt: Date,
  isHttps: boolean
): {
  httpOnly: true
  sameSite: 'none' | 'lax'
  secure: boolean
  path: '/'
  expires: Date
} {
  return {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    expires: expiresAt,
  }
}

export function requestIsHttps(req: NextRequest): boolean {
  const proto = (req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')).toString()
  return proto.split(',')[0].trim().toLowerCase() === 'https'
}

export async function getSessionUser(): Promise<SafeUser | null> {
  // Fresh-host safety: on an ephemeral server (Vercel) the first call builds the
  // schema before any query. On dev/prod SQLite this is a memoized no-op.
  await ensureDatabaseReady()
  const store = await cookies()
  let token = store.get(SESSION_COOKIE)?.value
  if (!token) {
    // Cookieless environments (preview iframes with storage access blocked)
    // send the same session token via the X-Session-Token header instead.
    const h = await headers()
    token = h.get(SESSION_HEADER) ?? undefined
  }
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  return toSafeUser(session.user)
}

export async function requireAdmin(): Promise<SafeUser | null> {
  const user = await getSessionUser()
  return user && user.role === 'ADMIN' ? user : null
}

export async function audit(data: {
  actorId?: string | null
  action: string
  targetType?: string
  targetId?: string
  detail?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: data.actorId ?? null,
        action: data.action,
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
        detail: data.detail ?? null,
      },
    })
  } catch {
    // never let audit logging break the main request
  }
}

export async function getFullUser(userId: string) {
  return db.user.findUnique({ where: { id: userId }, select: userSelect })
}
