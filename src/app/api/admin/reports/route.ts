import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Admin-only triage queue for buyer reports (audit item C2), newest first.
// SECURITY: explicit selects only — the reporter's contact details are shown
// to admins, but never password hashes, ID document paths or phone numbers.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        listing: {
          select: { id: true, title: true, status: true, sellerId: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return NextResponse.json({ reports })
  } catch (e) {
    console.error('admin reports error', e)
    return NextResponse.json({ error: 'Failed to load reports.' }, { status: 500 })
  }
}
