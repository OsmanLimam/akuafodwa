/*
 * Market-day palette — every produce category owns a colour, the way a real
 * Ghanaian market stall does: tomato red, mango orange, wheat gold, cocoa
 * brown, lagoon teal… Brand green stays the anchor for "All produce".
 *
 * `color` = the solid identity colour (active chips, dots, text on tint).
 * `tint`  = its pale wash for hover states and badges.
 */

export interface CategoryColor {
  color: string
  tint: string
}

const PALETTE: Record<string, CategoryColor> = {
  all: { color: '#1B5E20', tint: '#E8F5E9' }, // brand green
  vegetables: { color: '#DC2626', tint: '#FCE8E8' }, // tomato red
  fruits: { color: '#EA580C', tint: '#FEEBE0' }, // mango orange
  'roots-tubers': { color: '#B45309', tint: '#FBEBD9' }, // fresh clay
  'cash-crops': { color: '#6D4C2F', tint: '#EFE6DA' }, // cocoa brown
  'grains-legumes': { color: '#CA8A04', tint: '#FBF3D2' }, // wheat gold
  'poultry-eggs': { color: '#F59E0B', tint: '#FEF3D8' }, // honey yolk
  livestock: { color: '#9F1239', tint: '#FBE5EA' }, // deep wine
  'fish-aquaculture': { color: '#0F766E', tint: '#DCF2EF' }, // lagoon teal
  'processed-foods': { color: '#A21CAF', tint: '#F8E8FA' }, // berry plum
  'seeds-inputs': { color: '#4D7C0F', tint: '#EDF5DC' }, // olive leaf
}

const FALLBACK: CategoryColor = PALETTE.all

export function categoryColor(slug: string | null | undefined): CategoryColor {
  if (!slug) return FALLBACK
  return PALETTE[slug] ?? FALLBACK
}

/*
 * Pick readable label text on a solid chip: bright colours (gold, honey)
 * take near-black text, deep colours take the cream white.
 */
export function readableText(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1F2937' : '#FFFDF5'
}
