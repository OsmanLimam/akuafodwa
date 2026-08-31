import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, audit } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { ensureDatabaseReady } from '@/lib/bootstrap'
import { LISTING_IMAGE_URL } from '@/lib/file-validation'

const SELLER_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  sellerType: true,
  businessName: true,
  identityStatus: true,
} as const

const LISTING_INCLUDE = {
  category: true,
  seller: { select: SELLER_SELECT },
  images: { orderBy: { sortOrder: 'asc' as const } },
} as const

function cleanOptional(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const s = String(value).trim()
  return s ? s.slice(0, max) : null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabaseReady()
    const { id } = await ctx.params
    const user = await getSessionUser()

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        ...LISTING_INCLUDE,
        _count: { select: { favorites: true, threads: true } },
      },
    })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }

    // Count a view only for genuine visitors, not the owner or an admin.
    const isOwnerOrAdmin = user && (user.id === listing.sellerId || user.role === 'ADMIN')
    if (!isOwnerOrAdmin) {
      db.listing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})
    }

    const [rating, isFavorite, similar] = await Promise.all([
      db.review.aggregate({
        where: { sellerId: listing.sellerId },
        _avg: { rating: true },
        _count: true,
      }),
      user
        ? db.favorite.findUnique({
            where: { userId_listingId: { userId: user.id, listingId: id } },
          })
        : Promise.resolve(null),
      db.listing.findMany({
        where: {
          categoryId: listing.categoryId,
          id: { not: id },
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: LISTING_INCLUDE,
      }),
    ])

    return NextResponse.json({
      listing: {
        ...listing,
        isFavorite: Boolean(isFavorite),
        seller: {
          ...listing.seller,
          ratingAvg: rating._avg.rating ?? null,
          ratingCount: rating._count,
        },
      },
      similar,
    })
  } catch (e) {
    console.error('listing GET error', e)
    return NextResponse.json({ error: 'Failed to load listing.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const { id } = await ctx.params
    const listing = await db.listing.findUnique({ where: { id } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    const isOwner = listing.sellerId === user.id
    const isAdmin = user.role === 'ADMIN'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'You can only edit your own listings.' }, { status: 403 })
    }
    const rl = rateLimit(`listing-update:${user.id}`, 30, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many updates. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) {
      const t = String(body.title).trim()
      if (t.length < 3 || t.length > 120) {
        return NextResponse.json({ error: 'Title must be 3-120 characters.' }, { status: 400 })
      }
      data.title = t
    }
    if (body.description !== undefined) {
      const d = String(body.description).trim()
      if (d.length < 10 || d.length > 5000) {
        return NextResponse.json({ error: 'Description must be 10 to 5000 characters.' }, { status: 400 })
      }
      data.description = d
    }
    if (body.price !== undefined) {
      const p = parseFloat(body.price)
      if (isNaN(p) || p <= 0 || p > 10_000_000) {
        return NextResponse.json({ error: 'Invalid price.' }, { status: 400 })
      }
      data.price = p
    }
    if (body.quantity !== undefined) {
      const qn = parseFloat(body.quantity)
      if (isNaN(qn) || qn < 0 || qn > 10_000_000) {
        return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
      }
      data.quantity = qn
    }
    if (body.unit !== undefined) {
      const u = String(body.unit).trim().slice(0, 40)
      if (!u) return NextResponse.json({ error: 'Invalid unit.' }, { status: 400 })
      data.unit = u
    }
    if (body.region !== undefined) {
      const r = String(body.region).trim().slice(0, 60)
      if (!r) return NextResponse.json({ error: 'Invalid region.' }, { status: 400 })
      data.region = r
    }
    if (body.city !== undefined) data.city = cleanOptional(body.city, 80)
    if (body.priceNegotiable !== undefined) data.priceNegotiable = Boolean(body.priceNegotiable)
    if (body.grade !== undefined) data.grade = cleanOptional(body.grade, 60)
    if (body.packaging !== undefined) data.packaging = cleanOptional(body.packaging, 80)
    if (body.harvestInfo !== undefined) data.harvestInfo = cleanOptional(body.harvestInfo, 100)
    if (body.productionMethod !== undefined) data.productionMethod = cleanOptional(body.productionMethod, 60)
    if (body.minOrder !== undefined) {
      if (body.minOrder === null || body.minOrder === '') {
        data.minOrder = null
      } else {
        const mo = parseFloat(body.minOrder)
        if (isNaN(mo) || mo < 0) {
          return NextResponse.json({ error: 'Invalid minimum order.' }, { status: 400 })
        }
        data.minOrder = mo
      }
    }
    if (body.fulfillment !== undefined) {
      const f = String(body.fulfillment)
      if (!['PICKUP', 'DELIVERY', 'BOTH'].includes(f)) {
        return NextResponse.json({ error: 'Invalid fulfillment option.' }, { status: 400 })
      }
      data.fulfillment = f
    }

    if (body.isPremium !== undefined) {
      // Only admins may pin or unpin a listing (premium placement is granted, not bought).
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
      }
      data.isPremium = Boolean(body.isPremium)
      await audit({
        actorId: user.id,
        action: data.isPremium ? 'LISTING_PINNED' : 'LISTING_UNPINNED',
        targetType: 'LISTING',
        targetId: id,
        detail: listing.title,
      })
    }

    if (body.status !== undefined) {
      const s = String(body.status)
      if (s === 'SOLD' || s === 'ACTIVE') {
        data.status = s
      } else if (s === 'TAKEN_DOWN' || s === 'ACTIVE_RESTORE') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
        }
        data.status = s === 'TAKEN_DOWN' ? 'TAKEN_DOWN' : 'ACTIVE'
        await audit({
          actorId: user.id,
          action: s === 'TAKEN_DOWN' ? 'LISTING_TAKEN_DOWN' : 'LISTING_RESTORED',
          targetType: 'LISTING',
          targetId: id,
          detail: listing.title,
        })
      } else {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
    }

    if (body.images !== undefined && Array.isArray(body.images)) {
      const images: string[] = body.images
        .map((i: unknown) => String(i))
        .filter((u) => LISTING_IMAGE_URL.test(u))
        .slice(0, 6)
      if (images.length === 0) {
        return NextResponse.json({ error: 'At least one photo is required.' }, { status: 400 })
      }
      await db.listingImage.deleteMany({ where: { listingId: id } })
      await db.listingImage.createMany({
        data: images.map((url, i) => ({ listingId: id, url, sortOrder: i })),
      })
    }

    const updated = await db.listing.update({
      where: { id },
      data,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    })
    return NextResponse.json({ listing: updated })
  } catch (e) {
    console.error('listing PATCH error', e)
    return NextResponse.json({ error: 'Failed to update listing.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const { id } = await ctx.params
    const listing = await db.listing.findUnique({ where: { id } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (listing.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only delete your own listings.' }, { status: 403 })
    }
    await db.listing.delete({ where: { id } })
    if (user.role === 'ADMIN' && listing.sellerId !== user.id) {
      await audit({
        actorId: user.id,
        action: 'LISTING_DELETED',
        targetType: 'LISTING',
        targetId: id,
        detail: listing.title,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('listing DELETE error', e)
    return NextResponse.json({ error: 'Failed to delete listing.' }, { status: 500 })
  }
}
