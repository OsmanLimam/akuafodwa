'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { MapPin, Heart, Pin } from 'lucide-react'
import { api } from '@/lib/api'
import { formatGHS, timeAgo } from '@/lib/constants'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ListingCard({
  listing,
  onFavoriteChange,
}: {
  listing: ApiListing
  onFavoriteChange?: (listingId: string, isFavorite: boolean) => void
}) {
  const { navigate, user, requireAuth } = useApp()
  const [isFavorite, setIsFavorite] = useState(Boolean(listing.isFavorite))
  const [favBusy, setFavBusy] = useState(false)
  const cover = listing.images[0]?.url
  const sold = listing.status === 'SOLD'

  const doToggleFavorite = async () => {
    if (favBusy) return
    setFavBusy(true)
    try {
      const res = await api<{ isFavorite: boolean }>('/api/favorites', {
        method: 'POST',
        json: { listingId: listing.id },
      })
      setIsFavorite(res.isFavorite)
      onFavoriteChange?.(listing.id, res.isFavorite)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update favourites.')
    } finally {
      setFavBusy(false)
    }
  }

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      // After sign-in this card's save action resumes automatically.
      requireAuth(undefined, () => void doToggleFavorite())
      toast('Sign in to save your favourite produce.')
      return
    }
    void doToggleFavorite()
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/listing/${listing.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/listing/${listing.id}`)
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No photo</div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1B5E20] shadow-sm ring-1 ring-inset ring-[#1B5E20]/10 backdrop-blur-sm">
          {listing.category.name}
        </span>
        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from saved' : 'Save listing'}
          className={cn(
            'absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur transition-all hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isFavorite ? 'text-[#B3261E]' : 'text-[#124116] dark:text-[#6FBF73]'
          )}
        >
          <Heart size={17} className={cn(isFavorite && 'fill-current')} />
        </button>
        {listing.isPremium && !sold && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#FBC02D] px-2.5 py-1 text-[11px] font-semibold text-[#1F2937] shadow-md">
            <Pin size={12} className="rotate-45" aria-hidden="true" />
            Premium
          </span>
        )}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#124116]/60 backdrop-blur-[2px]">
            <span className="font-display text-3xl font-bold italic text-[#FFFDF5] rotate-[-6deg] border-2 border-[#FFFDF5] rounded-lg px-4 py-1">
              Sold
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-[15px] text-foreground">{listing.title}</h3>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-display text-lg font-bold text-[#1B5E20] dark:text-[#EDF7EE]">{formatGHS(listing.price)}</span>
          <span className="text-xs text-muted-foreground">/ {listing.unit}</span>
          {listing.priceNegotiable && (
            <span className="ml-auto rounded-full bg-[#FBC02D]/40 dark:bg-[#2E7D32]/40 px-2 py-0.5 text-[10px] font-medium text-[#124116] dark:text-[#6FBF73]">
              Negotiable
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={13} className="shrink-0 text-[#2E7D32] dark:text-[#A3C4A8]" />
            <span className="truncate">
              {listing.city ? `${listing.city}, ` : ''}
              {listing.region}
            </span>
          </span>
          <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </article>
  )
}
