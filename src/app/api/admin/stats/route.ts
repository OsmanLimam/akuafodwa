import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  try {
    const [users, listings, activeListings, soldListings, threads, agreed, completed, categories, reviews] =
      await Promise.all([
        db.user.count(),
        db.listing.count(),
        db.listing.count({ where: { status: 'ACTIVE' } }),
        db.listing.count({ where: { status: 'SOLD' } }),
        db.offerThread.count(),
        db.offerThread.count({ where: { status: 'AGREED' } }),
        db.offerThread.count({ where: { status: 'COMPLETED' } }),
        db.category.count(),
        db.review.count(),
      ])
    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    })
    return NextResponse.json({
      stats: { users, listings, activeListings, soldListings, threads, agreed, completed, categories, reviews },
      recentUsers,
    })
  } catch (e) {
    console.error('admin stats error', e)
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 })
  }
}
