/*
 * One-shot AkuafoDwa brand recolor: remap plum-hued pixels to forest green,
 * preserving luminance/shading, basket tan, sprout green, gold accents and alpha.
 * Selective by hue range + saturation, blended smoothly at anti-aliased edges.
 */
const sharp = require('sharp')

const FILES = [
  'public/logo.png',
  'public/logo-64.png',
  'public/logo-raw.png',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/apple-touch-icon.png',
  'src/app/icon.png',
  'src/app/apple-icon.png',
]

// plum badge hue ~261deg, allow 235..335; target forest green hue ~124deg
const H_MIN = 235
const H_MAX = 335
const H_TARGET = 124
const SAT_MIN = 0.1 // below this, pixel is treated as neutral (edges/shadows)

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

for (const rel of FILES) {
  const p = `/home/z/my-project/${rel}`
  const img = sharp(p)
  const { width, height, channels } = await img.metadata()
  const raw = await img.raw().toBuffer()
  const out = Buffer.from(raw)

  for (let i = 0; i < raw.length; i += channels) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2]
    const [h, s, l] = rgb2hsl(r, g, b)
    if (h >= H_MIN && h <= H_MAX && s > SAT_MIN && l > 0.03 && l < 0.97) {
      const blend = Math.min(1, (s - SAT_MIN) / 0.18) // smooth at edges
      const ns = Math.min(1, s * 1.18)
      const [nr, ng, nb] = hsl2rgb(H_TARGET, ns, l)
      out[i] = Math.round(r + (nr - r) * blend)
      out[i + 1] = Math.round(g + (ng - g) * blend)
      out[i + 2] = Math.round(b + (nb - b) * blend)
    }
  }

  await sharp(out, { raw: { width, height, channels } })
    .png({ compressionLevel: 9, palette: width <= 64 })
    .toFile(p + '.tmp')
  const fs = require('fs')
  fs.renameSync(p + '.tmp', p)
  console.log('recolored', rel, `${width}x${height}`)
}
console.log('done')
