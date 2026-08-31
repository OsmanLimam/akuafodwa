import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const { id } = await ctx.params
    const thread = await db.offerThread.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            unit: true,
            quantity: true,
            status: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
        buyer: { select: { id: true, name: true, phone: true, createdAt: true } },
        seller: { select: { id: true, name: true, phone: true, createdAt: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { name: true } } } },
        review: { select: { rating: true, comment: true } },
      },
    })
    if (!thread) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    if (thread.buyerId !== user.id && thread.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not your conversation.' }, { status: 403 })
    }

    const contactRevealed = thread.status === 'AGREED' || thread.status === 'COMPLETED'

    return NextResponse.json({
      thread: {
        ...thread,
        buyer: contactRevealed ? thread.buyer : { ...thread.buyer, phone: null },
        seller: contactRevealed ? thread.seller : { ...thread.seller, phone: null },
      },
    })
  } catch (e) {
    console.error('thread GET error', e)
    return NextResponse.json({ error: 'Failed to load conversation.' }, { status: 500 })
  }
}

