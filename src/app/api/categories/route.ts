import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDatabaseReady } from '@/lib/bootstrap'

export async function GET() {
  try {
    await ensureDatabaseReady()
    const categories = await db.category.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
    })
    return NextResponse.json({ categories })
  } catch (e) {
    console.error('categories GET error', e)
    return NextResponse.json({ error: 'Failed to load categories.' }, { status: 500 })
  }
}
