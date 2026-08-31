import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { sendPushToUser, preview } from '@/lib/push'

const ACTIVE_STATES = ['OPEN', 'NEGOTIATING']

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const { id } = await ctx.params
    const thread = await db.offerThread.findUnique({ where: { id } })
    if (!thread) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    const isBuyer = thread.buyerId === user.id
    const isSeller = thread.sellerId === user.id
    if (!isBuyer && !isSeller && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not your conversation.' }, { status: 403 })
    }

    const body = await req.json()
    const action = body.action ? String(body.action).toUpperCase() : null
    const kind = body.kind ? String(body.kind).toUpperCase() : 'MESSAGE'

    // The other side of this conversation (push notifications go to them)
    const notifyUserId = isBuyer ? thread.sellerId : thread.buyerId
    const pushDeal = (title: string, body: string) => {
      void sendPushToUser(notifyUserId, {
        title,
        body,
        url: `/#/inbox/${id}`,
        tag: `thread-${id}`,
      }).catch(() => undefined)
    }

    // ---- Structured actions ----
    if (action) {
      let systemMsg = ''
      let newStatus: string | null = null

      if (action === 'ACCEPT') {
        if (!isSeller) {
          return NextResponse.json({ error: 'Only the seller can accept an offer.' }, { status: 403 })
        }
        if (!ACTIVE_STATES.includes(thread.status)) {
          return NextResponse.json({ error: 'This offer is no longer active.' }, { status: 400 })
        }
        newStatus = 'AGREED'
        systemMsg =
          '🤝 Deal agreed! Contact details have been shared below. Please arrange payment and delivery together.'
      } else if (action === 'DECLINE') {
        if (!isSeller) {
          return NextResponse.json({ error: 'Only the seller can decline an offer.' }, { status: 403 })
        }
        if (!ACTIVE_STATES.includes(thread.status)) {
          return NextResponse.json({ error: 'This offer is no longer active.' }, { status: 400 })
        }
        newStatus = 'DECLINED'
        systemMsg = 'The seller declined this offer.'
      } else if (action === 'CANCEL') {
        if (!isBuyer) {
          return NextResponse.json({ error: 'Only the buyer can cancel this conversation.' }, { status: 403 })
        }
        if (!ACTIVE_STATES.includes(thread.status)) {
          return NextResponse.json({ error: 'This conversation is no longer active.' }, { status: 400 })
        }
        newStatus = 'CANCELLED'
        systemMsg = 'The buyer cancelled this conversation.'
      } else if (action === 'COMPLETE') {
        if (thread.status !== 'AGREED') {
          return NextResponse.json({ error: 'You can only complete an agreed deal.' }, { status: 400 })
        }
        newStatus = 'COMPLETED'
        systemMsg =
          '✅ Deal completed! The buyer can now rate the seller based on this transaction.'
      } else {
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
      }

      const updated = await db.offerThread.update({
        where: { id },
        data: { status: newStatus, updatedAt: new Date() },
      })
      await db.offerMessage.create({
        data: { threadId: id, senderId: null, kind: 'SYSTEM', body: systemMsg },
      })
      if (action === 'ACCEPT') {
        pushDeal('Deal agreed 🤝', 'Your offer was accepted! Phone numbers are now open — arrange payment and delivery.')
      } else if (action === 'DECLINE') {
        pushDeal('Offer declined', 'The seller declined your offer. You can make a new one on the listing.')
      } else if (action === 'CANCEL') {
        pushDeal('Conversation cancelled', 'The buyer withdrew from this conversation.')
      } else if (action === 'COMPLETE') {
        pushDeal('Deal completed ✅', 'This deal is marked complete. Remember to rate the seller!')
      }
      return NextResponse.json({ thread: updated })
    }

    // ---- Normal messages ----
    if (['DECLINED', 'CANCELLED', 'COMPLETED'].includes(thread.status)) {
      return NextResponse.json({ error: 'This conversation has ended.' }, { status: 400 })
    }

    if (kind === 'OFFER') {
      const quantity = parseFloat(body.quantity)
      const price = parseFloat(body.price)
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Please enter a valid quantity.' }, { status: 400 })
      }
      if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: 'Please enter a valid price.' }, { status: 400 })
      }
      const message = body.message ? String(body.message).trim().slice(0, 1000) : null
      await db.offerMessage.create({
        data: {
          threadId: id,
          senderId: user.id,
          kind: 'OFFER',
          quantity,
          price,
          body: message,
        },
      })
      await db.offerThread.update({
        where: { id },
        data: { status: 'NEGOTIATING', updatedAt: new Date() },
      })
      pushDeal(
        'Counter offer on your produce',
        `${user.name.split(' ')[0]} offers GH\u20b5${price} \u00d7 ${quantity}${message ? ` \u2014 \u201c${preview(message, 60)}\u201d` : ''}`
      )
      return NextResponse.json({ ok: true }, { status: 201 })
    }

    // Plain MESSAGE
    const text = String(body.body ?? '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
    }
    await db.offerMessage.create({
      data: {
        threadId: id,
        senderId: user.id,
        kind: 'MESSAGE',
        body: text.slice(0, 2000),
      },
    })
    await db.offerThread.update({
      where: { id },
      data: { updatedAt: new Date() },
    })
    pushDeal(`${user.name.split(' ')[0]} sent a message`, preview(text))
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    console.error('thread message POST error', e)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
