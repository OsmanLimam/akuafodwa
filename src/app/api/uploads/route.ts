import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { sniffImage, IMAGE_MIME_TO_EXT } from '@/lib/file-validation'

const MAX_SIZE = 4 * 1024 * 1024 // 4MB

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  const rl = rateLimit(`uploads:${user.id}`, 40, 60 * 60 * 1000)
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
    const mimeExt = IMAGE_MIME_TO_EXT[file.type]
    if (!mimeExt) {
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

    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${sniff.ext}`
    await writeFile(path.join(dir, name), bytes)

    return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 })
  } catch (e) {
    console.error('uploads POST error', e)
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 })
  }
}
