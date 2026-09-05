'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  MapPin,
  Eye,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Heart,
  Share2,
  HandCoins,
  Package,
  BadgeCheck,
  ShieldQuestion,
  Pin,
  Link2,
  Flag,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatGHS, timeAgo } from '@/lib/constants'
import { categoryColor, readableText } from '@/lib/category-colors'
import { fulfillmentLabel, sellerTypeLabel } from '@/lib/types'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { ListingCard } from './listing-card'
import { BrandGlyph } from './social-buttons'
import { AvatarInitials, ListingCardSkeleton, SectionHeading, Stars } from './misc'
import { ReportDialog } from './report-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ListingDetailView({ id }: { id: string }) {
  const { user, navigate, requireAuth, t } = useApp()
  const [listing, setListing] = useState<ApiListing | null>(null)
  const [similar, setSimilar] = useState<ApiListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    api<{ listing: ApiListing; similar: ApiListing[] }>(`/api/listings/${id}`)
      .then((data) => {
        if (cancelled) return
        setListing(data.listing)
        setSimilar(data.similar)
        setIsFavorite(Boolean(data.listing.isFavorite))
        setActiveImage(0)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load listing.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const isOwner = user && listing && user.id === listing.seller.id

  const doToggleFavorite = async () => {
    try {
      const res = await api<{ isFavorite: boolean }>('/api/favorites', {
        method: 'POST',
        json: { listingId: id },
      })
      setIsFavorite(res.isFavorite)
      toast(res.isFavorite ? 'Saved to your list. 💛' : 'Removed from your saved list.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update favourites.')
    }
  }

  const toggleFavorite = () => {
    if (!user) {
      requireAuth(undefined, doToggleFavorite)
      toast('Sign in to save your favourite produce.')
      return
    }
    void doToggleFavorite()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/3] rounded-3xl bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-32 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">Listing not found</h1>
        <p className="mt-2 text-muted-foreground">{error ?? 'This listing may have been removed.'}</p>
        <Button onClick={() => navigate('/')} className="mt-6 rounded-full bg-[#1B5E20] text-[#FFFDF5] hover:bg-[#124116]">
          <ArrowLeft size={16} className="mr-2" /> {t('back_to_market')}
        </Button>
      </div>
    )
  }

  // ---- WhatsApp share cards ----
  // Crawlable link (/\?listing=<id>): WhatsApp unfurls it with the real photo,
  // title and cedi price via the server-emitted Open Graph tags.
  // Defined after the loading/error guards so `listing` is narrowed to a
  // non-null ApiListing inside these helpers.
  const buildShareUrl = () => `${window.location.origin}/?listing=${id}`
  const buildShareText = () => {
    const where = listing.city ? `${listing.city}, ${listing.region}` : listing.region
    return `${listing.title} — ${formatGHS(listing.price)} / ${listing.unit}\n📍 ${where}\nSee it on AkuafoDwa:`
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${buildShareText()} ${buildShareUrl()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const shareFacebook = () => {
    const url = encodeURIComponent(buildShareUrl())
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer')
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl())
      toast('Link copied. Paste it anywhere — it shows the photo, price and stall. 📲')
    } catch {
      toast.error('Could not copy the link.')
    }
  }

  const shareMore = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: listing.title, text: buildShareText(), url: buildShareUrl() })
        return
      } catch {
        return // user closed the share sheet
      }
    }
    await copyShareLink()
  }

  const sold = listing.status === 'SOLD'
  const takedown = listing.status === 'TAKEN_DOWN'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#6FBF73] dark:hover:text-[#8FD694] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {t('back_to_market')}
      </button>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-md">
            {listing.images[activeImage] ? (
              <Image
                src={listing.images[activeImage].url}
                alt={`${listing.title}, photo ${activeImage + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No photo</div>
            )}
            {sold && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#124116]/60 backdrop-blur-[2px]">
                <span className="font-display text-4xl font-bold italic text-[#FFFDF5] rotate-[-6deg] border-2 border-[#FFFDF5] rounded-xl px-6 py-2">
                  {t('sold_out')}
                </span>
              </div>
            )}
            {takedown && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#124116]/60 backdrop-blur-[2px]">
                <span className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white">
                  Removed by AkuafoDwa admins
                </span>
              </div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="nice-scroll mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative h-20 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition-all outline-none',
                    i === activeImage ? 'ring-[#2E7D32]' : 'ring-transparent hover:ring-[#FBC02D]'
                  )}
                  aria-label={`View photo ${i + 1}`}
                >
                  <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium shadow-sm"
              style={{
                backgroundColor: categoryColor(listing.category.slug).color,
                color: readableText(categoryColor(listing.category.slug).color),
              }}
            >
              {listing.category.name}
            </span>
            {listing.priceNegotiable && (
              <span className="rounded-full bg-[#FBE5EA] dark:bg-[#9F1239]/30 px-3 py-1 text-xs font-medium text-[#9F1239] dark:text-[#F5A3BC]">
                {t('price_negotiable')}
              </span>
            )}
            {listing.isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FBC02D] px-3 py-1 text-xs font-semibold text-[#1F2937] shadow-sm">
                <Pin size={13} className="rotate-45" aria-hidden="true" />
                Premium
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold leading-tight text-[#1F2937] dark:text-[#EDF7EE]">
            {listing.title}
          </h1>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-[#1B5E20] dark:text-[#6FBF73]">{formatGHS(listing.price)}</span>
            <span className="text-muted-foreground">/ {listing.unit}</span>
          </div>

          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <MetaRow icon={<Package size={16} />} label={t('quantity_available')} value={`${listing.quantity} ${listing.unit}`} />
            {(listing.minOrder !== null && listing.minOrder > 0) && (
              <MetaRow icon={<Package size={16} />} label={t('minimum_order')} value={`${listing.minOrder} ${listing.unit}`} />
            )}
            <MetaRow
              icon={<MapPin size={16} />}
              label={t('location')}
              value={listing.city ? `${listing.city}, ${listing.region}` : listing.region}
            />
            <MetaRow icon={<Eye size={16} />} label={t('views')} value={`${listing.views}`} />
            <MetaRow icon={<Clock size={16} />} label={t('listed')} value={timeAgo(listing.createdAt)} />
          </dl>

          {((listing.grade || listing.packaging || listing.harvestInfo || listing.productionMethod) || listing.minOrder !== null) && (
            <div className="mt-4 rounded-2xl bg-card border border-border p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Produce details</h2>
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                {listing.grade && <SpecRow label="Quality / grade" value={listing.grade} />}
                {listing.packaging && <SpecRow label="Packaging" value={listing.packaging} />}
                {listing.harvestInfo && <SpecRow label="Harvest" value={listing.harvestInfo} />}
                {listing.productionMethod && <SpecRow label="Production" value={listing.productionMethod} />}
                {listing.minOrder !== null && listing.minOrder > 0 && (
                  <SpecRow label={t('minimum_order')} value={`${listing.minOrder} ${listing.unit}`} />
                )}
                <SpecRow label="Fulfilment" value={fulfillmentLabel(listing.fulfillment)} />
              </dl>
            </div>
 )}

          <div className="mt-6 rounded-2xl bg-card border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('description')}</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[15px] text-foreground/90">
              {listing.description}
            </p>
          </div>

          {/* Seller */}
          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <AvatarInitials name={listing.seller.name} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold truncate">
                    {listing.seller.name}
                    {listing.seller.identityStatus === 'VERIFIED' && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shrink-0"
                        title="This seller completed our identity verification."
                      >
                        <BadgeCheck size={13} /> Identity verified
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Stars value={listing.seller.ratingAvg} />
                    <span>
                      {listing.seller.ratingAvg
                        ? `${listing.seller.ratingAvg.toFixed(1)} from ${listing.seller.ratingCount} completed deal${listing.seller.ratingCount === 1 ? '' : 's'}`
                        : 'New seller, no reviews yet'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sellerTypeLabel(listing.seller.sellerType) ?? 'Market member'}
                    {listing.seller.businessName ? ` (${listing.seller.businessName})` : ''}
                    {' · Member since '}
                    {new Date(listing.seller.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-[#124116] dark:text-[#A3C4A8] shrink-0">
                <MapPin size={12} /> {listing.region}
              </span>
            </div>
            {listing.seller.identityStatus === 'UNVERIFIED' && (
              <p className="mt-2.5 flex items-start gap-1.5 border-t border-border pt-2.5 text-sm leading-relaxed text-muted-foreground">
                <ShieldQuestion size={13} className="mt-0.5 shrink-0 text-[#2E7D32] dark:text-[#6FBF73]" />
                This seller has not completed identity verification yet. Arrange to inspect the goods before you pay.
              </p>
            )}
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#2E7D32]/40 bg-[#E8F5E9]/60 dark:bg-[#1B3D24]/60 p-4 text-sm text-[#124116] dark:text-[#D7EED9]">
              <p className="font-medium">This is your listing. 🪴</p>
              <p className="mt-1 text-muted-foreground">
                Manage offers and update it from your dashboard.
              </p>
              <Button
                onClick={() => navigate('/my-listings')}
                className="mt-3 rounded-full bg-[#1B5E20] text-[#FFFDF5] hover:bg-[#124116]"
                size="sm"
              >
                Go to my listings
              </Button>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                disabled={sold || takedown}
                onClick={() => {
                  // requireAuth queues opening the offer dialog as a pending
                  // action, so after sign-in the user lands straight in it.
                  if (!requireAuth(`#/listing/${id}`, () => setOfferOpen(true))) return
                  setOfferOpen(true)
                }}
                className="h-12 flex-1 min-w-40 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] px-6 font-semibold text-[#FFFDF5] dark:text-[#071A0C] shadow-lg hover:bg-[#124116] dark:hover:bg-[#FFFDF5] disabled:opacity-50"
              >
                <HandCoins size={18} className="mr-2" />
                {sold ? t('sold_out') : t('make_an_offer')}
              </Button>
              <Button
                variant="outline"
                onClick={toggleFavorite}
                className={cn(
                  'h-12 rounded-full border-[#FBC02D] px-5 text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20',
                  isFavorite && 'border-[#B3261E]/40 text-[#B3261E] dark:text-[#E4574E]'
                )}
              >
                <Heart size={17} className={cn('mr-1.5', isFavorite && 'fill-current')} />
                {isFavorite ? t('saved_short') : t('save')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-[#FBC02D] px-5 text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20"
                    aria-label="Share this listing"
                  >
                    <Share2 size={17} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem onClick={shareWhatsApp} className="gap-2.5 py-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.25 8.23m4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.73-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29" />
                    </svg>
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareFacebook} className="gap-2.5 py-2.5">
                    <BrandGlyph name="Facebook" className="h-4 w-4 text-[#1877F2]" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareMore} className="gap-2.5 py-2.5">
                    <Share2 size={15} /> More options…
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyShareLink} className="gap-2.5 py-2.5">
                    <Link2 size={15} /> Copy link
                  </DropdownMenuItem>
                  {/* C2: report entry — signed-in buyers only (owners never see
                      this menu; the offer block replaces it for them). */}
                  {user && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setReportOpen(true)}
                        className="gap-2.5 py-2.5 text-[#B3261E] focus:text-[#B3261E] dark:text-[#E4574E] dark:focus:text-[#E4574E]"
                      >
                        <Flag size={15} />
                        {t('report_listing')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Safety */}
          <div className="mt-5 rounded-2xl border border-[#FBC02D]/50 bg-[#FFFDF5]/50 dark:bg-[#1B3D24]/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#124116] dark:text-[#6FBF73]">
              <ShieldAlert size={16} className="text-[#2E7D32] dark:text-[#6FBF73]" /> Safety first
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground list-disc list-inside">
              <li>Inspect produce or animals in person, or send someone you trust.</li>
              <li>The seller&apos;s phone number appears here once your deal is agreed.</li>
              <li>Meet in open places for payments and pickups. Never send money ahead unseen.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div className="mt-16">
          <SectionHeading title={t('similar_produce')} subtitle={`More in ${listing.category.name}`} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}

      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        listing={listing}
        onSent={(threadId) => {
          setOfferOpen(false)
          navigate(`/inbox/${threadId}`)
        }}
      />

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} listingId={id} />
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-3.5 py-2.5">
      <span className="text-[#2E7D32] dark:text-[#6FBF73]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="font-medium truncate">{value}</dd>
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1 last:border-b-0">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  )
}

export function OfferDialog({
  open,
  onOpenChange,
  listing,
  onSent,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  listing: ApiListing
  onSent: (threadId: string) => void
}) {
  const { t } = useApp()
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const effectivePrice = useMemo(() => {
    const p = parseFloat(price)
    return isNaN(p) || p <= 0 ? listing.price : p
  }, [price, listing.price])

  const total = useMemo(() => {
    const q = parseFloat(quantity)
    return isNaN(q) ? 0 : q * effectivePrice
  }, [quantity, effectivePrice])

  useEffect(() => {
    if (open) {
      setQuantity('1')
      setPrice('')
      setMessage('')
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    try {
      const res = await api<{ threadId: string }>('/api/threads', {
        method: 'POST',
        json: {
          listingId: listing.id,
          quantity: parseFloat(quantity),
          price: effectivePrice,
          message: message || undefined,
        },
      })
      toast.success('Offer sent! The seller has been notified. 🤝')
      onSent(res.threadId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send offer.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#1B5E20] dark:text-[#EDF7EE]">{t('make_an_offer')}</DialogTitle>
          <DialogDescription>
            {listing.title}: asking {formatGHS(listing.price)} / {listing.unit}. Negotiate respectfully;
            the seller can accept, counter or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="offer-qty">Quantity ({listing.unit})</Label>
              <Input
                id="offer-qty"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1.5 bg-background"
              />
            </div>
            <div>
              <Label htmlFor="offer-price">Your price (GH₵ / {listing.unit})</Label>
              <Input
                id="offer-price"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={String(listing.price)}
                className="mt-1.5 bg-background"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#FFFDF5]/70 dark:bg-[#1B3D24] border border-[#FBC02D]/60 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Offer total</span>
            <span className="font-display text-xl font-bold text-[#1B5E20] dark:text-[#6FBF73]">{formatGHS(total)}</span>
          </div>

          <div>
            <Label htmlFor="offer-msg">Message (optional)</Label>
            <Textarea
              id="offer-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I can pick up from the farm this week. Any discount for bulk?"
              rows={3}
              className="mt-1.5 bg-background resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={busy || !parseFloat(quantity) || !effectivePrice}
            className="w-full rounded-full bg-[#1B5E20] font-semibold text-[#FFFDF5] hover:bg-[#124116] h-11"
          >
            {busy ? 'Sending…' : `${t('send_offer')} 🤝`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
