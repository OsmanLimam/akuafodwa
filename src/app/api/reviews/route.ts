import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { ensureDatabaseReady } from '@/lib/bootstrap'

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseReady()
    const sp = req.nextUrl.searchParams
    const sellerId = sp.get('sellerId') ?? ''
    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required.' }, { status: 400 })
    }
    const reviews = await db.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true } },
        thread: {
          select: {
            listing: { select: { title: true } },
          },
        },
      },
    })
    const avg = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null
    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        buyer: r.buyer,
        listingTitle: r.thread.listing.title,
      })),
      avg,
      count: reviews.length,
    })
  } catch (e) {
    console.error('reviews GET error', e)
    return NextResponse.json({ error: 'Failed to load reviews.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const threadId = String(body.threadId ?? '')
    const rating = parseInt(body.rating)
    const comment = body.comment ? String(body.comment).trim().slice(0, 1000) : null

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Please choose a rating from 1 to 5 stars.' }, { status: 400 })
    }

    const thread = await db.offerThread.findUnique({ where: { id: threadId } })
    if (!thread) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    if (thread.buyerId !== user.id) {
      return NextResponse.json({ error: 'Only the buyer can rate this deal.' }, { status: 403 })
    }
    if (thread.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can rate after the deal is completed.' }, { status: 400 })
    }
    const existing = await db.review.findUnique({ where: { threadId } })
    if (existing) {
      return NextResponse.json({ error: 'You have already rated this deal.' }, { status: 409 })
    }

    const review = await db.review.create({
      data: {
        threadId,
        sellerId: thread.sellerId,
        buyerId: user.id,
        rating,
        comment,
      },
    })
    return NextResponse.json({ review }, { status: 201 })
  } catch (e) {
    console.error('reviews POST error', e)
    return NextResponse.json({ error: 'Failed to submit rating.' }, { status: 500 })
  }
}
