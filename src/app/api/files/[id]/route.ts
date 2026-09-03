import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Publicly serves LISTING_IMAGE files stored in the database. Photos are
// immutable once uploaded, so they cache forever. Identity documents are
// deliberately NOT reachable here — they only stream via the admin-only
// verification document endpoint.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid file id.' }, { status: 400 })
  }
  try {
    const file = await db.storedFile.findUnique({
      where: { id },
      select: { kind: true, mime: true, data: true },
    })
    if (!file || file.kind !== 'LISTING_IMAGE') {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 })
    }
    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline',
      },
    })
  } catch (e) {
    console.error('files GET error', e)
    return NextResponse.json({ error: 'Failed to load file.' }, { status: 500 })
  }
}
