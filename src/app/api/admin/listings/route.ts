import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  try {
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const status = sp.get('status') ?? 'ALL'
    const where: Record<string, unknown> = {}
    if (status !== 'ALL') where.status = status
    if (q) where.title = { contains: q, mode: 'insensitive' }
    const listings = await db.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    })
    return NextResponse.json({ listings })
  } catch (e) {
    console.error('admin listings error', e)
    return NextResponse.json({ error: 'Failed to load listings.' }, { status: 500 })
  }
}
