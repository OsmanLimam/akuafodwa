// File validation helpers: magic-byte sniffing so the declared MIME type
// cannot be trusted on its own (prevents renamed executables etc).

export type SniffResult = { ok: true; ext: 'jpg' | 'png' | 'webp' } | { ok: false }

export function sniffImage(bytes: Buffer): SniffResult {
  if (bytes.length < 12) return { ok: false }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ok: true, ext: 'jpg' }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { ok: true, ext: 'png' }
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ok: true, ext: 'webp' }
  }
  return { ok: false }
}

export const IMAGE_MIME_TO_EXT: Record<string, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
