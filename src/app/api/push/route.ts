import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { getVapidPublicKey } from '@/lib/push'

/**
 * Web push subscription management.
 * GET    -> VAPID public key + how many devices this account has enabled
 * POST   -> save/refresh a subscription for the signed-in user
 * DELETE -> remove a subscription (user turned notifications off)
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  const count = await db.pushSubscription.count({ where: { userId: user.id } })
  return NextResponse.json({ publicKey: getVapidPublicKey(), devices: count })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const sub = body.subscription ?? body
    const endpoint = typeof sub?.endpoint === 'string' ? sub.endpoint : ''
    const p256dh = sub?.keys?.p256dh
    const auth = sub?.keys?.auth
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid subscription payload.' }, { status: 400 })
    }
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: user.id, p256dh: String(p256dh), auth: String(auth) },
      create: {
        userId: user.id,
        endpoint,
        p256dh: String(p256dh),
        auth: String(auth),
        userAgent: req.headers.get('user-agent')?.slice(0, 250) ?? null,
      },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    console.error('push subscribe error', e)
    return NextResponse.json({ error: 'Could not save the subscription.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : ''
    if (endpoint) {
      await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } })
    } else {
      await db.pushSubscription.deleteMany({ where: { userId: user.id } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('push unsubscribe error', e)
    return NextResponse.json({ error: 'Could not remove the subscription.' }, { status: 500 })
  }
}
