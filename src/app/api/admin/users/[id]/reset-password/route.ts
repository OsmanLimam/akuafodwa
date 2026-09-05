import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { requireAdmin, audit, hashPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

// C7 stopgap: admin-issued password reset for traders who are locked out
// (no email infrastructure by design). The temporary password is returned to
// the admin exactly once, to be handed over in person.
//
// - Admin targets are BLOCKED: admin accounts must use their own
//   Change-password flow (Profile), so one admin can never lock another out.
// - Every session row of the trader is deleted: after a reset, any device
//   still holding the old (possibly stolen) session is signed out.
// - The temp password itself is NEVER written to the audit log or stored
//   anywhere — only its scrypt hash lands in the database.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  // Hard cap per admin per hour: resets are rare, manual events.
  // (await is REQUIRED: rateLimit is now async/DB-backed — see lib/rate-limit.ts)
  const rl = await rateLimit(`admin-reset:${admin.id}`, 20, 3600_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many password resets. Please try again later.' },
      { status: 429 },
    )
  }
  try {
    const { id } = await ctx.params
    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }
    if (target.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Use your own Change-password flow for admin accounts.' },
        { status: 400 },
      )
    }

    // Temp password: "Akuafo-" + 8 hex chars (16 chars total, same convention
    // as the Task 27 founder rescue credential).
    const tempPassword = `Akuafo-${randomBytes(4).toString('hex')}`

    await db.$transaction([
      db.user.update({
        where: { id: target.id },
        data: { passwordHash: hashPassword(tempPassword) },
      }),
      // Lockout everywhere: old password holders lose their sessions too.
      db.session.deleteMany({ where: { userId: target.id } }),
    ])

    await audit({
      actorId: admin.id,
      action: 'PASSWORD_RESET_BY_ADMIN',
      targetType: 'User',
      targetId: target.id,
      detail: `${target.email} (password issued to admin, never stored in clear)`,
    })

    // The ONLY time the temp password is revealed.
    return NextResponse.json({ tempPassword })
  } catch (e) {
    console.error('admin reset-password error', e)
    return NextResponse.json({ error: 'Failed to reset the password.' }, { status: 500 })
  }
}
