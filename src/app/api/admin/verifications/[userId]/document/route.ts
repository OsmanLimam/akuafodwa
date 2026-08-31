import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Admin-only: stream a submitted identity document for review.
// The document lives in the database as a private StoredFile (kind
// ID_DOCUMENT) and is only reachable through this admin check — never by a
// direct URL.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
  }
  const { userId } = await params
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { idDocumentPath: true },
  })
  if (!user?.idDocumentPath) {
    return NextResponse.json({ error: 'No document on file.' }, { status: 404 })
  }
  if (!/^[A-Za-z0-9]+$/.test(user.idDocumentPath)) {
    return NextResponse.json({ error: 'Invalid document reference.' }, { status: 400 })
  }
  try {
    const file = await db.storedFile.findUnique({
      where: { id: user.idDocumentPath },
      select: { kind: true, mime: true, data: true },
    })
    if (!file || file.kind !== 'ID_DOCUMENT') {
      return NextResponse.json({ error: 'Document file missing.' }, { status: 404 })
    }
    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.mime,
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline',
      },
    })
  } catch (e) {
    console.error('admin document GET error', e)
    return NextResponse.json({ error: 'Failed to load document.' }, { status: 500 })
  }
}
