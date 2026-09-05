import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, audit } from '@/lib/auth'

// Admin-only triage of a single buyer report.
// DISMISS   → mark the report DISMISSED (no action on the listing).
// TAKE_DOWN → mark the report ACTIONED and hide the listing (TAKEN_DOWN).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')

    if (!['DISMISS', 'TAKE_DOWN'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    }

    const report = await db.report.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
    }

    if (action === 'DISMISS') {
      await db.report.update({ where: { id }, data: { status: 'DISMISSED' } })
      await audit({
        actorId: admin.id,
        action: 'REPORT_DISMISSED',
        targetType: 'REPORT',
        targetId: report.id,
        detail: `Report on listing ${report.listingId} (${report.reason})`,
      })
    } else {
      await db.report.update({ where: { id }, data: { status: 'ACTIONED' } })
      await db.listing.update({
        where: { id: report.listingId },
        data: { status: 'TAKEN_DOWN' },
      })
      await audit({
        actorId: admin.id,
        action: 'LISTING_TAKEN_DOWN',
        targetType: 'LISTING',
        targetId: report.listingId,
        detail: `Buyer report ${report.id} (${report.reason})`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin report action error', e)
    return NextResponse.json({ error: 'Failed to update the report.' }, { status: 500 })
  }
}
