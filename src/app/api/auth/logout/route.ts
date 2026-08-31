import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

export async function POST(_req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (user) {
      await db.session.deleteMany({ where: { userId: user.id } })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, '', { path: '/', expires: new Date(0) })
    return res
  } catch (e) {
    console.error('logout error', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
