/*
 * Derive all AkuafoDwa brand assets from the owner's showcase art (370x342).
 * Squares are normalized via fit:'fill' (8% vertical stretch, imperceptible on
 * stylized art). Full-bleed versions over-scan then center-crop so the rounded
 * corners fall outside the frame entirely - no black can survive.
 */
const sharp = require('sharp')
const P = '/home/z/my-project'

async function main() {
  const art = await sharp('/tmp/icon-src2.png')
    .extract({ left: 0, top: 0, width: 370, height: 342 })
    .png()
    .toBuffer()

  // Rounded-corner transparent master (370x370)
  const r = 79
  const mask = Buffer.from(
    `<svg width="370" height="370"><rect width="370" height="370" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  )
  const rounded = await sharp(art)
    .resize(370, 370, { fit: 'fill' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  const roundedTargets = [
    [`${P}/public/icons/favicon.png`, 256],
    [`${P}/public/icons/icon-192.png`, 192],
    [`${P}/public/icons/icon-512.png`, 512],
    [`${P}/public/logo.png`, 512],
    [`${P}/public/logo-64.png`, 64],
    [`${P}/public/logo-raw.png`, 1024],
  ]
  for (const [out, s] of roundedTargets) {
    await sharp(rounded).resize(s, s).png({ compressionLevel: 9 }).toFile(out)
    console.log('rounded', out, s)
  }

  // Full-bleed: over-scan to 720, center-crop 512 -> corners are out of frame
  const fullbleed = await sharp(art)
    .resize(720, 720, { fit: 'fill' })
    .extract({ left: 104, top: 104, width: 512, height: 512 })
    .png()
    .toBuffer()
  await sharp(fullbleed).png({ compressionLevel: 9 }).toFile(`${P}/public/icons/icon-512-maskable.png`)
  await sharp(fullbleed).resize(180, 180).png({ compressionLevel: 9 }).toFile(`${P}/public/icons/apple-touch-icon.png`)
  console.log('full-bleed maskable 512 + apple-touch 180 done')
}

main().catch((e) => { console.error(e); process.exit(1) })
