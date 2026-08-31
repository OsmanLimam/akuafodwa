export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Western North',
  'Central',
  'Eastern',
  'Volta',
  'Oti',
  'Ahafo',
  'Bono',
  'Bono East',
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
] as const

export const UNITS = [
  'kg',
  'maxi bag (50kg)',
  'bag',
  'olonka',
  'paint rubber',
  'crate',
  'basket',
  'bunch',
  'tuber',
  'piece',
  'head',
  'live bird',
  'litre',
  'gallon',
  'box',
] as const

export interface DefaultCategory {
  name: string
  slug: string
  icon: string
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Roots & Tubers', slug: 'roots-tubers', icon: 'Sprout' },
  { name: 'Grains & Legumes', slug: 'grains-legumes', icon: 'Wheat' },
  { name: 'Vegetables', slug: 'vegetables', icon: 'Carrot' },
  { name: 'Fruits', slug: 'fruits', icon: 'Apple' },
  { name: 'Cash Crops', slug: 'cash-crops', icon: 'Leaf' },
  { name: 'Poultry & Eggs', slug: 'poultry-eggs', icon: 'Egg' },
  { name: 'Livestock', slug: 'livestock', icon: 'Beef' },
  { name: 'Fish & Aquaculture', slug: 'fish-aquaculture', icon: 'Fish' },
  { name: 'Processed Foods', slug: 'processed-foods', icon: 'Package' },
  { name: 'Seeds & Agro Inputs', slug: 'seeds-inputs', icon: 'FlaskConical' },
]

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatGHS(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })}`
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export const THREAD_STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-[#FBC02D]/40 text-[#124116]',
  NEGOTIATING: 'bg-[#F57C00]/15 text-[#C49000]',
  AGREED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-[#1B5E20] text-[#FFFDF5]',
  DECLINED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
}
