import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to save favourites.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const listingId = String(body.listingId ?? '')
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listing.' }, { status: 400 })
    }
    const listing = await db.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }

    const existing = await db.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
    })
    if (existing) {
      await db.favorite.delete({ where: { userId_listingId: { userId: user.id, listingId } } })
      return NextResponse.json({ isFavorite: false })
    }
    await db.favorite.create({ data: { userId: user.id, listingId } })
    return NextResponse.json({ isFavorite: true })
  } catch (e) {
    console.error('favorites POST error', e)
    return NextResponse.json({ error: 'Failed to update favourites.' }, { status: 500 })
  }
}
