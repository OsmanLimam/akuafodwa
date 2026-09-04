import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    const users = await db.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      // SECURITY: explicit select — never serialize password hashes or ID
      // document references to the browser.
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        identityStatus: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    })
    return NextResponse.json({ users })
  } catch (e) {
    console.error('admin users error', e)
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 })
  }
}
