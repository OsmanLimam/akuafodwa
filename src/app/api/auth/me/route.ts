import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, toSafeUser } from '@/lib/auth'

const SELLER_TYPES = ['FARMER', 'TRADER', 'WHOLESALER', 'RETAILER', 'PROCESSOR', 'RESTAURANT', 'INSTITUTION', 'LOGISTICS', 'OTHER']

export async function GET() {
  const user = await getSessionUser()
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const current = await getSessionUser()
  if (!current) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const name = body.name !== undefined ? String(body.name).trim() : undefined
    const phone = body.phone !== undefined ? String(body.phone).trim().slice(0, 20) : undefined
    const sellerType = body.sellerType !== undefined ? String(body.sellerType) : undefined
    const businessName = body.businessName !== undefined ? String(body.businessName).trim().slice(0, 120) : undefined
    const bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 500) : undefined
    const profileImage = body.profileImage !== undefined ? String(body.profileImage).slice(0, 300) : undefined

    if (name !== undefined && (name.length < 2 || name.length > 80)) {
      return NextResponse.json({ error: 'Name must be between 2 and 80 characters.' }, { status: 400 })
    }
    if (sellerType !== undefined && sellerType !== null && sellerType !== '' && !SELLER_TYPES.includes(sellerType)) {
      return NextResponse.json({ error: 'Please choose a valid seller type.' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: current.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(sellerType !== undefined ? { sellerType: sellerType || null } : {}),
        ...(businessName !== undefined ? { businessName: businessName || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(profileImage !== undefined ? { profileImage: profileImage || null } : {}),
      },
    })
    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e) {
    console.error('me patch error', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
