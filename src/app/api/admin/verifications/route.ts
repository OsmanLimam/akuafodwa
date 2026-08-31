import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Admin-only: the identity verification queue.
// Never returns document contents here, only metadata. Documents are streamed
// separately through /api/admin/verifications/[userId]/document.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
  }
  const users = await db.user.findMany({
    where: { identityStatus: { in: ['PENDING', 'VERIFIED', 'REJECTED'] } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      sellerType: true,
      businessName: true,
      identityStatus: true,
      idDocumentType: true,
      verifiedAt: true,
      verificationNote: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
    orderBy: [{ identityStatus: 'asc' }, { updatedAt: 'desc' }],
    take: 100,
  })
  // PENDING first (asc puts PENDING before REJECTED before VERIFIED alphabetically:
  // PENDING < REJECTED < VERIFIED is false alphabetically; sort explicitly below).
  const order: Record<string, number> = { PENDING: 0, REJECTED: 1, VERIFIED: 2 }
  users.sort((a, b) => (order[a.identityStatus] ?? 9) - (order[b.identityStatus] ?? 9))
  return NextResponse.json({ users })
}
