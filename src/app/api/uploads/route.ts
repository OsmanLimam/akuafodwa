import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { sniffImage, IMAGE_MIME_TO_EXT } from '@/lib/file-validation'

const MAX_SIZE = 4 * 1024 * 1024 // 4MB

// Listing photos are stored IN the database (StoredFile) and served back
// through /api/files/[id]. No writable disk needed — works on Vercel.
export async function POST(req: NextRequest) {
  // CSRF guard for multipart POSTs (simple requests skip CORS preflight):
  // if the browser sent an Origin, it must match our own host — mirroring the
  // x-forwarded-host/proto handling pattern in requestIsHttps (lib/auth.ts).
  const origin = req.headers.get('origin')
  if (origin) {
    const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(',')[0].trim().toLowerCase()
    let originHost = ''
    try {
      originHost = new URL(origin).host.toLowerCase()
    } catch {
      originHost = ''
    }
    if (!host || originHost !== host) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
    }
  }
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  const rl = await rateLimit(`upload:${user.id}`, 30, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Upload limit reached for this hour. Please try again later.' },
      { status: 429 }
    )
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }
    const mime = IMAGE_MIME_TO_EXT[file.type] ? file.type : null
    if (!mime) {
      return NextResponse.json({ error: 'Only JPG, PNG or WEBP images are allowed.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be smaller than 4MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const sniff = sniffImage(bytes)
    if (!sniff.ok) {
      return NextResponse.json({ error: 'That file is not a valid image.' }, { status: 400 })
    }

    const created = await db.storedFile.create({
      data: {
        kind: 'LISTING_IMAGE',
        mime,
        size: bytes.length,
        data: bytes,
        ownerId: user.id,
      },
      select: { id: true },
    })

    return NextResponse.json({ url: `/api/files/${created.id}` }, { status: 201 })
  } catch (e) {
    console.error('uploads POST error', e)
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 })
  }
}
