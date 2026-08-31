import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { sendPushToUser, preview } from '@/lib/push'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const sp = req.nextUrl.searchParams

    if (sp.get('meta') === '1') {
      const [selling, buying, agreements] = await Promise.all([
        db.offerThread.count({
          where: { sellerId: user.id, status: { in: ['OPEN', 'NEGOTIATING'] } },
        }),
        db.offerThread.count({
          where: { buyerId: user.id, status: { in: ['OPEN', 'NEGOTIATING'] } },
        }),
        db.offerThread.count({
          where: {
            OR: [{ sellerId: user.id }, { buyerId: user.id }],
            status: { in: ['AGREED', 'COMPLETED'] },
          },
        }),
      ])
      return NextResponse.json({ selling, buying, agreements })
    }

    const role = sp.get('role') === 'seller' ? 'seller' : sp.get('role') === 'buyer' ? 'buyer' : 'all'
    const listingId = sp.get('listingId') ?? ''

    const where: Record<string, unknown> = {}
    if (role === 'seller') where.sellerId = user.id
    else if (role === 'buyer') where.buyerId = user.id
    else where.OR = [{ sellerId: user.id }, { buyerId: user.id }]
    if (listingId) where.listingId = listingId

    const threads = await db.offerThread.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            unit: true,
            status: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
        buyer: { select: { id: true, name: true, phone: true } },
        seller: { select: { id: true, name: true, phone: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        review: { select: { rating: true } },
      },
    })

    return NextResponse.json({
      threads: threads.map((t) => ({
        ...t,
        messages: t.messages.reverse(),
      })),
    })
  } catch (e) {
    console.error('threads GET error', e)
    return NextResponse.json({ error: 'Failed to load conversations.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to make an offer.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const listingId = String(body.listingId ?? '')
    const quantity = parseFloat(body.quantity)
    const price = parseFloat(body.price)
    const message = body.message ? String(body.message).trim().slice(0, 1000) : null

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listing.' }, { status: 400 })
    }
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Please enter a valid quantity.' }, { status: 400 })
    }
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Please enter a valid offer price.' }, { status: 400 })
    }

    const listing = await db.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (listing.sellerId === user.id) {
      return NextResponse.json({ error: 'You cannot make an offer on your own listing.' }, { status: 400 })
    }
    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This listing is no longer active.' }, { status: 400 })
    }

    // Reuse an existing open thread by this buyer on this listing
    let thread = await db.offerThread.findFirst({
      where: {
        listingId,
        buyerId: user.id,
        status: { in: ['OPEN', 'NEGOTIATING'] },
      },
    })

    if (!thread) {
      thread = await db.offerThread.create({
        data: {
          listingId,
          buyerId: user.id,
          sellerId: listing.sellerId,
          status: 'NEGOTIATING',
        },
      })
      await db.offerMessage.create({
        data: {
          threadId: thread.id,
          senderId: null,
          kind: 'SYSTEM',
          body: `Offer conversation started for "${listing.title}".`,
        },
      })
    }

    await db.offerMessage.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        kind: 'OFFER',
        quantity,
        price,
        body: message,
      },
    })
    await db.offerThread.update({
      where: { id: thread.id },
      data: { status: 'NEGOTIATING', updatedAt: new Date() },
    })

    // Web push: tell the seller about the offer (best-effort, never blocks).
    void sendPushToUser(listing.sellerId, {
      title: `New offer: ${listing.title}`,
      body: `${user.name.split(' ')[0]} offers GH\u20b5${price} \u00d7 ${quantity} ${listing.unit}${message ? ` \u2014 \u201c${preview(message, 60)}\u201d` : ''}`,
      url: `/#/inbox/${thread.id}`,
      tag: `thread-${thread.id}`,
    }).catch(() => undefined)

    return NextResponse.json({ threadId: thread.id }, { status: 201 })
  } catch (e) {
    console.error('threads POST error', e)
    return NextResponse.json({ error: 'Failed to send offer.' }, { status: 500 })
  }
}
