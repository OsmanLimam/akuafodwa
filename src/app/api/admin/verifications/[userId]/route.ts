import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, audit } from '@/lib/auth'

// Admin-only: approve or reject an identity verification request.
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
  }
  try {
    const { userId } = await params
    const body = await req.json()
    const decision = String(body.decision ?? '')
    const note = body.note !== undefined ? String(body.note).trim().slice(0, 300) : null

    if (!['APPROVE', 'REJECT'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 })
    }

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, identityStatus: true, name: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }
    if (target.identityStatus === 'UNVERIFIED') {
      return NextResponse.json({ error: 'This user has not submitted documents.' }, { status: 409 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        identityStatus: decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
        verifiedAt: decision === 'APPROVE' ? new Date() : null,
        verificationNote: note,
      },
    })

    await audit({
      actorId: admin.id,
      action: decision === 'APPROVE' ? 'IDENTITY_APPROVED' : 'IDENTITY_REJECTED',
      targetType: 'USER',
      targetId: userId,
      detail: note ? `Note: ${note}` : undefined,
    })

    return NextResponse.json({
      identityStatus: updated.identityStatus,
      verificationNote: updated.verificationNote,
    })
  } catch (e) {
    console.error('verification decision error', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
