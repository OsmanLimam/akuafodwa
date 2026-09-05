import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUser, audit } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

const REPORT_REASONS = [
  'SPAM',
  'FAKE',
  'SCAM',
  'WRONG_PRICE',
  'ALREADY_SOLD',
  'OFFENSIVE',
  'OTHER',
] as const

// Buyer-facing moderation entry point (audit item C2): report a suspicious
// listing. One report per buyer per listing (unique [listingId, reporterId]),
// rate limited per account so a hostile user cannot flood the queue.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to report a listing.' }, { status: 401 })
  }
  const rl = await rateLimit(`report:${user.id}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'You have reported several listings recently. Please try again later.' },
      { status: 429 }
    )
  }
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = String(body.reason ?? '')
    if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) {
      return NextResponse.json({ error: 'Please choose a reason for the report.' }, { status: 400 })
    }
    const details =
      body.details === undefined || body.details === null
        ? null
        : String(body.details).trim().slice(0, 500) || null

    const listing = await db.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (listing.sellerId === user.id) {
      return NextResponse.json({ error: 'You cannot report your own listing.' }, { status: 400 })
    }

    try {
      await db.report.create({
        data: {
          listingId: listing.id,
          reporterId: user.id,
          reason,
          details,
        },
      })
    } catch (e) {
      // Unique [listingId, reporterId]: the buyer already reported this listing.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return NextResponse.json({ error: 'You already reported this listing.' }, { status: 409 })
      }
      throw e
    }

    await audit({
      actorId: user.id,
      action: 'LISTING_REPORTED',
      targetType: 'LISTING',
      targetId: listing.id,
      detail: reason,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    console.error('listing report error', e)
    return NextResponse.json({ error: 'Failed to submit the report. Please try again.' }, { status: 500 })
  }
}
