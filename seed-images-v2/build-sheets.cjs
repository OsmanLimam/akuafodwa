// Download all candidate images and build labeled contact sheets for review.
const fs = require('fs')
const path = require('path')

const BASE = '/home/z/my-project/seed-images-v2'
const CAND = path.join(BASE, 'candidates')
const SHEETS = path.join(BASE, 'sheets')
const PUBLIC_SEED = '/home/z/my-project/public/uploads/seed'

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return buf.length
}

async function main() {
  let sharp = require('/home/z/my-project/node_modules/sharp')
  if (typeof sharp !== 'function') sharp = sharp.default || sharp.sharp || sharp
  fs.mkdirSync(CAND, { recursive: true })
  fs.mkdirSync(SHEETS, { recursive: true })

  const files = fs.readdirSync(BASE).filter((f) => f.endsWith('.json'))
  const manifest = {}

  for (const file of files) {
    const slug = file.replace('.json', '')
    const j = JSON.parse(fs.readFileSync(path.join(BASE, file), 'utf-8'))
    if (!j.success || !Array.isArray(j.results)) continue
    const entries = []
    for (let i = 0; i < j.results.length; i++) {
      const r = j.results[i]
      if (!r.original_url) continue
      const ext = (r.original_url.split('.').pop() || 'jpg').split('?')[0].toLowerCase()
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
      const dest = path.join(CAND, `${slug}-${i}.${safeExt}`)
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
        try {
          await download(r.original_url, dest)
        } catch (e) {
          console.log(`DL FAIL ${slug}-${i}: ${e.message}`)
          continue
        }
      }
      entries.push({ idx: i, file: dest, source: r.source || '?', w: r.original_width, h: r.original_height })
    }
    manifest[slug] = entries
    console.log(`${slug}: ${entries.length} candidates`)
  }

  fs.writeFileSync(path.join(BASE, 'manifest.json'), JSON.stringify(manifest, null, 1))

  // Build contact sheets: 6 candidates per sheet, 3 cols x 2 rows, each cell 320x240 + label strip
  const CELL_W = 320
  const CELL_H = 240
  const LABEL_H = 26
  for (const [slug, entries] of Object.entries(manifest)) {
    if (!entries.length) continue
    if (fs.existsSync(path.join(SHEETS, `${slug}.jpg`))) { console.log(`sheet exists: ${slug}`); continue }
    const cols = 3
    const rows = Math.ceil(entries.length / cols)
    const composites = []
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = col * CELL_W
      const y = row * (CELL_H + LABEL_H)
      try {
        const resized = await sharp(e.file)
          .resize(CELL_W, CELL_H, { fit: 'cover' })
          .jpeg({ quality: 72 })
          .toBuffer()
        composites.push({ input: resized, left: x, top: y + LABEL_H })
        const esc = String(`${e.idx} ${e.source} ${e.w || ''}x${e.h || ''}`).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        const label = Buffer.from(
          `<svg width="${CELL_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="18" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff">#${esc}</text></svg>`
        )
        composites.push({ input: label, left: x, top: y })
      } catch (e2) {
        console.log(`RESIZE FAIL ${slug}-${i}: ${e2.message}`)
      }
    }
    await sharp({
      create: {
        width: cols * CELL_W,
        height: rows * (CELL_H + LABEL_H),
        channels: 3,
        background: { r: 240, g: 240, b: 240 },
      },
    })
      .composite(composites)
      .jpeg({ quality: 78 })
      .toFile(path.join(SHEETS, `${slug}.jpg`))
    console.log(`sheet: ${slug}`)
  }
  console.log('ALL DONE')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
