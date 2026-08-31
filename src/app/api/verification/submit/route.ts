import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, audit } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { sniffImage, IMAGE_MIME_TO_EXT } from '@/lib/file-validation'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DOC_TYPES = ['GHANA_CARD', 'PASSPORT', 'DRIVERS_LICENSE', 'BUSINESS_REGISTRATION']

// Identity documents are HIGHLY SENSITIVE. They are stored in the database as
// a private StoredFile and can never be reached by a direct URL — the only way
// to view one is the admin-only document endpoint. The user row stores the
// StoredFile id in idDocumentPath.
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  if (user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Admin accounts do not need verification.' }, { status: 400 })
  }
  const rl = rateLimit(`verify-submit:${user.id}`, 3, 24 * 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'You have submitted several requests today. Please try again tomorrow.' },
      { status: 429 }
    )
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    const docType = String(form.get('docType') ?? '')
    if (!DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: 'Please choose a valid document type.' }, { status: 400 })
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No document uploaded.' }, { status: 400 })
    }
    const mimeExt = IMAGE_MIME_TO_EXT[file.type]
    if (!mimeExt) {
      return NextResponse.json({ error: 'Only JPG, PNG or WEBP images are allowed.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Document must be smaller than 5MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const sniff = sniffImage(bytes)
    if (!sniff.ok) {
      return NextResponse.json({ error: 'That file is not a valid image.' }, { status: 400 })
    }

    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { identityStatus: true },
    })
    if (current?.identityStatus === 'PENDING') {
      return NextResponse.json({ error: 'Your verification is already being reviewed.' }, { status: 409 })
    }
    if (current?.identityStatus === 'VERIFIED') {
      return NextResponse.json({ error: 'Your identity is already verified.' }, { status: 409 })
    }

    // Stored privately in the database; never exposed by a public URL.
    const created = await db.storedFile.create({
      data: {
        kind: 'ID_DOCUMENT',
        mime: file.type,
        size: bytes.length,
        data: bytes,
        ownerId: user.id,
      },
      select: { id: true },
    })

    await db.user.update({
      where: { id: user.id },
      data: {
        identityStatus: 'PENDING',
        idDocumentType: docType,
        idDocumentPath: created.id,
        verificationNote: null,
      },
    })

    await audit({
      actorId: user.id,
      action: 'IDENTITY_SUBMITTED',
      targetType: 'USER',
      targetId: user.id,
      detail: `Document type: ${docType}`,
    })

    return NextResponse.json(
      { identityStatus: 'PENDING', message: 'Your documents were received. Our team usually reviews within 2 working days.' },
      { status: 201 }
    )
  } catch (e) {
    console.error('verification submit error', e)
    return NextResponse.json({ error: 'Failed to submit your document.' }, { status: 500 })
  }
}
