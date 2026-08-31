export interface ApiUser {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  sellerType: string | null
  businessName: string | null
  bio: string | null
  identityStatus: string
  verificationNote: string | null
  createdAt: string
}

export interface ApiListingImage {
  id: string
  url: string
  sortOrder: number
}

export interface ApiCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  isDefault: boolean
  _count?: { listings: number }
}

export interface ApiSeller {
  id: string
  name: string
  phone: string | null
  createdAt: string
  sellerType: string | null
  businessName: string | null
  identityStatus: string
  ratingAvg?: number | null
  ratingCount?: number
}

export const SELLER_TYPES = [
  { value: 'FARMER', label: 'Farmer' },
  { value: 'TRADER', label: 'Trader' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'PROCESSOR', label: 'Processor' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'INSTITUTION', label: 'Institution' },
  { value: 'LOGISTICS', label: 'Logistics provider' },
  { value: 'OTHER', label: 'Other' },
] as const

export function sellerTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return SELLER_TYPES.find((t) => t.value === value)?.label ?? null
}

export const PRODUCTION_METHODS = [
  'Conventional',
  'Organic practices (not certified)',
  'Greenhouse',
  'Free range',
  'Wild harvested',
] as const

export const FULFILLMENT_OPTIONS = [
  { value: 'PICKUP', label: 'Pickup only' },
  { value: 'DELIVERY', label: 'Delivery available' },
  { value: 'BOTH', label: 'Pickup or delivery' },
] as const

export function fulfillmentLabel(value: string | null | undefined): string {
  return FULFILLMENT_OPTIONS.find((f) => f.value === value)?.label ?? 'Pickup only'
}

export interface ApiListing {
  id: string
  title: string
  description: string
  price: number
  unit: string
  quantity: number
  priceNegotiable: boolean
  region: string
  city: string | null
  grade: string | null
  packaging: string | null
  harvestInfo: string | null
  productionMethod: string | null
  minOrder: number | null
  fulfillment: string
  status: string
  isPremium: boolean
  views: number
  createdAt: string
  updatedAt: string
  category: ApiCategory
  seller: ApiSeller
  images: ApiImageRef[]
  _count?: { favorites: number; threads: number }
  isFavorite?: boolean
}

export interface ApiImageRef {
  id: string
  url: string
  sortOrder: number
}

export interface ApiOfferMessage {
  id: string
  threadId: string
  senderId: string | null
  senderName?: string | null
  kind: string
  quantity: number | null
  price: number | null
  body: string | null
  createdAt: string
}

export interface ApiThread {
  id: string
  status: string
  listingId: string
  createdAt: string
  updatedAt: string
  listing: {
    id: string
    title: string
    price: number
    unit: string
    status: string
    images: ApiImageRef[]
  }
  buyer: { id: string; name: string; phone: string | null }
  seller: { id: string; name: string; phone: string | null }
  messages: ApiOfferMessage[]
  review?: { rating: number; comment: string | null } | null
  _count?: { messages: number }
}

export interface ApiReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  buyer: { id: string; name: string }
  listingTitle?: string
}
