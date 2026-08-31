import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, sessionCookieOptions, requestIsHttps, toSafeUser, SESSION_COOKIE } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { ensureDatabaseReady } from '@/lib/bootstrap'

const SELLER_TYPES = ['FARMER', 'TRADER', 'WHOLESALER', 'RETAILER', 'PROCESSOR', 'RESTAURANT', 'INSTITUTION', 'LOGISTICS', 'OTHER']

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many sign-up attempts. Please try again in about ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.` },
      { status: 429 }
    )
  }
  try {
    await ensureDatabaseReady()
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = body.phone ? String(body.phone).trim().slice(0, 20) : null
    const password = String(body.password ?? '')
    const sellerType = body.sellerType ? String(body.sellerType) : null

    if (!name || name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (sellerType && !SELLER_TYPES.includes(sellerType)) {
      return NextResponse.json({ error: 'Please choose a valid seller type.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashPassword(password),
        ...(sellerType ? { sellerType } : {}),
      },
    })

    const { token, expiresAt } = await createSession(user.id)
    const res = NextResponse.json({ user: toSafeUser(user), token }, { status: 201 })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt, requestIsHttps(req)))
    return res
  } catch (e) {
    console.error('register error', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
