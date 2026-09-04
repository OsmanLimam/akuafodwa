import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { slugify } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { ensureDatabaseReady } from '@/lib/bootstrap'
import { LISTING_IMAGE_URL } from '@/lib/file-validation'

const SELLER_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  // SECURITY: phone is deliberately excluded from public responses. Buyers
  // receive the seller's number only after a deal is AGREED, via the
  // authenticated thread endpoint (see api/threads/[id]).
  sellerType: true,
  businessName: true,
  identityStatus: true,
} as const

const LISTING_INCLUDE = {
  category: true,
  seller: { select: SELLER_SELECT },
  images: { orderBy: { sortOrder: 'asc' as const } },
} as const

// Only locally-hosted uploads may be referenced as listing images.
function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .map((i) => String(i))
    .filter((u) => LISTING_IMAGE_URL.test(u))
    .slice(0, 6)
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseReady()
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim().slice(0, 100) ?? ''
    const categorySlug = sp.get('category') ?? ''
    const region = sp.get('region') ?? ''
    const minPrice = parseFloat(sp.get('minPrice') ?? '')
    const maxPrice = parseFloat(sp.get('maxPrice') ?? '')
    const sort = sp.get('sort') ?? 'newest'
    const page = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
    const pageSize = Math.min(48, Math.max(1, parseInt(sp.get('pageSize') ?? '12') || 12))
    const sellerId = sp.get('sellerId') ?? ''
    const status = sp.get('status') ?? 'ACTIVE'
    const favorites = sp.get('favorites') === '1'

    const user = await getSessionUser()

    if (favorites) {
      if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
      const favs = await db.favorite.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: LISTING_INCLUDE,
          },
        },
      })
      const listings = favs.map((f) => ({ ...f.listing, isFavorite: true }))
      return NextResponse.json({ listings, total: listings.length, page: 1, pages: 1 })
    }

    const where: Record<string, unknown> = {}
    if (status !== 'ALL') where.status = status
    if (sellerId) where.sellerId = sellerId
    if (categorySlug) where.category = { slug: categorySlug }
    if (region) where.region = region
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      where.price = {
        ...(isNaN(minPrice) ? {} : { gte: minPrice }),
        ...(isNaN(maxPrice) ? {} : { lte: maxPrice }),
      }
    }
    if (q) {
      // Postgres contains is case-sensitive; mode: 'insensitive' makes the
      // search behave the same way it did on SQLite (ASCII case-insensitive).
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { region: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Pinned (premium) listings sit at the top of every sort, then the chosen order.
    const orderBy: Array<Record<string, string>> = [
      { isPremium: 'desc' },
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : sort === 'popular'
            ? { views: 'desc' }
            : { createdAt: 'desc' },
    ]

    const [total, rows] = await Promise.all([
      db.listing.count({ where }),
      db.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: LISTING_INCLUDE,
      }),
    ])

    let favoriteIds = new Set<string>()
    if (user) {
      const favs = await db.favorite.findMany({
        where: { userId: user.id, listingId: { in: rows.map((r) => r.id) } },
      })
      favoriteIds = new Set(favs.map((f) => f.listingId))
    }

    const listings = rows.map((r) => ({ ...r, isFavorite: favoriteIds.has(r.id) }))
    return NextResponse.json({
      listings,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (e) {
    console.error('listings GET error', e)
    return NextResponse.json({ error: 'Failed to load listings.' }, { status: 500 })
  }
}

function cleanOptional(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s ? s.slice(0, max) : null
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to sell on AkuafoDwa.' }, { status: 401 })
  }
  const rl = rateLimit(`listing-create:${user.id}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'You have posted several listings recently. Please try again later.' },
      { status: 429 }
    )
  }
  try {
    const body = await req.json()
    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim()
    const price = parseFloat(body.price)
    const quantity = parseFloat(body.quantity)
    const unit = String(body.unit ?? '').trim().slice(0, 40)
    const region = String(body.region ?? '').trim()
    const city = cleanOptional(body.city, 80)
    const priceNegotiable = body.priceNegotiable !== false
    const images = sanitizeImages(body.images)

    // Optional structured detail fields
    const grade = cleanOptional(body.grade, 60)
    const packaging = cleanOptional(body.packaging, 80)
    const harvestInfo = cleanOptional(body.harvestInfo, 100)
    const productionMethod = cleanOptional(body.productionMethod, 60)
    const minOrder = body.minOrder === undefined || body.minOrder === null || body.minOrder === '' ? null : parseFloat(body.minOrder)
    const fulfillment = ['PICKUP', 'DELIVERY', 'BOTH'].includes(String(body.fulfillment)) ? String(body.fulfillment) : 'PICKUP'

    if (title.length < 3 || title.length > 120) {
      return NextResponse.json({ error: 'Title must be 3-120 characters.' }, { status: 400 })
    }
    if (description.length < 10 || description.length > 5000) {
      return NextResponse.json(
        { error: 'Please describe your produce (10 to 5000 characters).' },
        { status: 400 }
      )
    }
    if (isNaN(price) || price <= 0 || price > 10_000_000) {
      return NextResponse.json({ error: 'Please enter a valid asking price.' }, { status: 400 })
    }
    if (isNaN(quantity) || quantity <= 0 || quantity > 10_000_000) {
      return NextResponse.json({ error: 'Please enter a valid quantity.' }, { status: 400 })
    }
    if (minOrder !== null && (isNaN(minOrder) || minOrder < 0 || minOrder > quantity)) {
      return NextResponse.json(
        { error: 'Minimum order cannot be more than the quantity available.' },
        { status: 400 }
      )
    }
    if (!unit || !region) {
      return NextResponse.json({ error: 'Please choose a unit and a region.' }, { status: 400 })
    }
    if (images.length === 0) {
      return NextResponse.json({ error: 'Please add at least one photo.' }, { status: 400 })
    }

    // Resolve category
    let categoryId = body.categoryId ? String(body.categoryId) : ''
    const newCategory = body.newCategory ? String(body.newCategory).trim() : ''
    if (!categoryId && newCategory) {
      if (newCategory.length < 2 || newCategory.length > 50) {
        return NextResponse.json({ error: 'Category name must be 2-50 characters.' }, { status: 400 })
      }
      const slug = slugify(newCategory)
      const existing = await db.category.findUnique({ where: { slug } })
      const cat =
        existing ??
        (await db.category.create({
          data: { name: newCategory, slug, icon: 'Tag', isDefault: false },
        }))
      categoryId = cat.id
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Please choose a category.' }, { status: 400 })
    }
    const category = await db.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 400 })
    }

    const listing = await db.listing.create({
      data: {
        title,
        description,
        price,
        unit,
        quantity,
        region,
        city,
        priceNegotiable,
        grade,
        packaging,
        harvestInfo,
        productionMethod,
        minOrder,
        fulfillment,
        sellerId: user.id,
        categoryId: category.id,
        images: {
          create: images.map((url, i) => ({ url, sortOrder: i })),
        },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (e) {
    console.error('listings POST error', e)
    return NextResponse.json({ error: 'Failed to create listing.' }, { status: 500 })
  }
}
