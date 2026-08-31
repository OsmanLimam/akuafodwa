import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

// Admin-only: stream a submitted identity document for review.
// The file lives outside /public and is only reachable through this check.
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
  // Only allow plain filenames, no path traversal.
  const safeName = path.basename(user.idDocumentPath)
  if (safeName !== user.idDocumentPath) {
    return NextResponse.json({ error: 'Invalid document reference.' }, { status: 400 })
  }
  try {
    const bytes = await readFile(path.join(process.cwd(), 'private-verification-docs', safeName))
    const ext = safeName.split('.').pop() ?? 'jpg'
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': EXT_MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Document file missing.' }, { status: 404 })
  }
}
