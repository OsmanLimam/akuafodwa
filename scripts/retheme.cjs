/*
 * One-shot AkuafoDwa retheme: plum/rose -> forest green / harvest gold / warm cream.
 * Ordered, context-aware replacements. Safe to run once; keeps alpha suffixes (/30 etc).
 */
const fs = require('fs')
const path = require('path')

const files = [
  'src/components/akuafo/auth-dialog.tsx',
  'src/components/akuafo/pwa.tsx',
  'src/components/akuafo/favorites-view.tsx',
  'src/components/akuafo/inbox-view.tsx',
  'src/components/akuafo/my-listings-view.tsx',
  'src/components/akuafo/footer.tsx',
  'src/components/akuafo/header.tsx',
  'src/components/akuafo/listing-detail-view.tsx',
  'src/components/akuafo/profile-view.tsx',
  'src/components/akuafo/browse-view.tsx',
  'src/components/akuafo/listing-card.tsx',
  'src/components/akuafo/create-listing-view.tsx',
  'src/components/akuafo/admin-view.tsx',
  'src/components/akuafo/misc.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/manifest.ts',
]

// Ordered rules: exact string replaces (case-insensitive on the hex only).
// Dark rules first, then the gold-pair special case, then generic catch-alls.
const exactRules = [
  // --- dark mode explicit pairs (before light generics) ---
  [/dark:text-\[#190019\]/gi, 'dark:text-[#071A0C]'],
  [/dark:bg-\[#DFB6B2\]/gi, 'dark:bg-[#4CAF50]'],
  [/dark:border-\[#DFB6B2\]/gi, 'dark:border-[#4CAF50]'],
  [/dark:text-\[#DFB6B2\]/gi, 'dark:text-[#6FBF73]'],
  [/dark:border-\[#4A2A56\]/gi, 'dark:border-[#2C5236]'],
  [/dark:bg-\[#2C1538\]/gi, 'dark:bg-[#16351F]'],
  [/dark:bg-\[#221030\]/gi, 'dark:bg-[#12301C]'],
  [/dark:bg-\[#3A1B47\]/gi, 'dark:bg-[#1B3D24]'],
  [/dark:border-\[#3F2249\]/gi, 'dark:border-[#24452C]'],
  [/dark:text-\[#F5E9F2\]/gi, 'dark:text-[#EDF7EE]'],
  [/dark:text-\[#C9A8BC\]/gi, 'dark:text-[#A3C4A8]'],

  // --- hero gradient tail: end on emerald instead of deep forest ---
  [/via-\[#2B124C\] to-\[#522B5B\]/gi, 'via-[#1B5E20] to-[#2E7D32]'],

  // --- generic plum palette -> agricultural palette ---
  [/from-\[#190019\]/gi, 'from-[#0C2410]'],
  [/bg-\[#190019\]/gi, 'bg-[#124116]'],
  [/text-\[#190019\]/gi, 'text-[#1F2937]'],
  [/\[#190019\]/gi, '[#1F2937]'],
  [/\[#2B124C\]/gi, '[#1B5E20]'],
  [/\[#522B5B\]/gi, '[#124116]'],
  [/\[#854F6C\]/gi, '[#2E7D32]'],
  [/\[#DFB6B2\]/gi, '[#FBC02D]'],
  [/\[#FBE4D8\]/gi, '[#FFFDF5]'],
  [/\[#F5E3D7\]/gi, '[#E8F5E9]'],
  [/\[#F4E0D6\]/gi, '[#E8F5E9]'],
  [/\[#E9CDBF\]/gi, '[#DDE5DE]'],
  [/\[#E3C4B5\]/gi, '[#C5D2C6]'],
  [/\[#6E4A5E\]/gi, '[#52605A]'],
  [/\[#FFF8F2\]/gi, '[#FFFFFF]'],
  [/\[#14061C\]/gi, '[#0A1F10]'],
  [/\[#221030\]/gi, '[#12301C]'],
  [/\[#2C1538\]/gi, '[#16351F]'],
  [/\[#3A1B47\]/gi, '[#1B3D24]'],
  [/\[#3F2249\]/gi, '[#24452C]'],
  [/\[#4A2A56\]/gi, '[#2C5236]'],
  [/\[#C9A8BC\]/gi, '[#A3C4A8]'],
  [/\[#F5E9F2\]/gi, '[#EDF7EE]'],
  [/\[#F7E8EF\]/gi, '[#D7EED9]'],
]

for (const rel of files) {
  const p = path.join('/home/z/my-project', rel)
  if (!fs.existsSync(p)) continue
  let src = fs.readFileSync(p, 'utf8')

  // Special case FIRST: text on a gold (was rose) button becomes charcoal per
  // the owner's palette spec (Secondary CTA: #FBC02D bg + #1F2937 text).
  src = src.replace(
    /bg-\[#DFB6B2\][^\n"'`]*?text-\[#2B124C\]/gi,
    (m) => m.replace(/text-\[#2B124C\]/gi, 'text-[#1F2937]')
  )

  for (const [re, to] of exactRules) src = src.replace(re, to)

  fs.writeFileSync(p, src)
  console.log('rethemed', rel)
}
console.log('done')
