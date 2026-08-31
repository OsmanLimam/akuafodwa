import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, sessionCookieOptions, requestIsHttps, toSafeUser, SESSION_COOKIE } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { ensureDatabaseReady } from '@/lib/bootstrap'

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady()
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
    const password = String(body.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    // Brute-force protection: per IP and per account.
    const ip = clientIp(req)
    const ipRl = rateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000)
    const acctRl = rateLimit(`login:acct:${email}`, 6, 15 * 60 * 1000)
    if (!ipRl.ok || !acctRl.ok) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please wait about 15 minutes and try again.' },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const { token, expiresAt } = await createSession(user.id)
    const res = NextResponse.json({ user: toSafeUser(user), token })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt, requestIsHttps(req)))
    return res
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
