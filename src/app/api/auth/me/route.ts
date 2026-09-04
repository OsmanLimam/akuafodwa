import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, toSafeUser, verifyPassword, hashPassword, audit, SESSION_COOKIE } from '@/lib/auth'
import { SESSION_HEADER } from '@/lib/session'

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
    const currentPassword = body.currentPassword !== undefined ? String(body.currentPassword) : undefined
    const newPassword = body.newPassword !== undefined ? String(body.newPassword) : undefined

    if (name !== undefined && (name.length < 2 || name.length > 80)) {
      return NextResponse.json({ error: 'Name must be between 2 and 80 characters.' }, { status: 400 })
    }
    if (sellerType !== undefined && sellerType !== null && sellerType !== '' && !SELLER_TYPES.includes(sellerType)) {
      return NextResponse.json({ error: 'Please choose a valid seller type.' }, { status: 400 })
    }

    // ---- Password change (requires proving the current password) ----
    if (newPassword !== undefined) {
      if (newPassword.length < 8 || newPassword.length > 200) {
        return NextResponse.json(
          { error: 'Please choose a new password with at least 8 characters.' },
          { status: 400 },
        )
      }
      if (currentPassword === undefined || currentPassword === '') {
        return NextResponse.json(
          { error: 'Please enter your current password first.' },
          { status: 400 },
        )
      }
      const full = await db.user.findUnique({ where: { id: current.id } })
      if (!full || !verifyPassword(currentPassword, full.passwordHash)) {
        return NextResponse.json(
          { error: 'Your current password is not correct. Please try again.' },
          { status: 400 },
        )
      }
    }

    const user = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: current.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(phone !== undefined ? { phone: phone || null } : {}),
          ...(sellerType !== undefined ? { sellerType: sellerType || null } : {}),
          ...(businessName !== undefined ? { businessName: businessName || null } : {}),
          ...(bio !== undefined ? { bio: bio || null } : {}),
          ...(profileImage !== undefined ? { profileImage: profileImage || null } : {}),
          ...(newPassword !== undefined ? { passwordHash: hashPassword(newPassword) } : {}),
        },
      })
      if (newPassword !== undefined) {
        // Sign every OTHER device out (this session stays logged in).
        const { cookies, headers } = await import('next/headers')
        const cookieStore = await cookies()
        const headerStore = await headers()
        const currentSessionToken =
          cookieStore.get(SESSION_COOKIE)?.value ?? headerStore.get(SESSION_HEADER) ?? undefined
        await tx.session.deleteMany({
          where: { userId: current.id, ...(currentSessionToken ? { token: { not: currentSessionToken } } : {}) },
        })
        await audit({ actorId: current.id, action: 'password_changed', targetType: 'User', targetId: current.id })
      }
      return updated
    })
    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e) {
    console.error('me patch error', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
