'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { ListingCard } from './listing-card'
import { EmptyState, ListingCardSkeleton, SectionHeading } from './misc'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

export function FavoritesView() {
  const { user, userLoading, navigate, t } = useApp()
  const [listings, setListings] = useState<ApiListing[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api<{ listings: ApiListing[] }>('/api/listings?favorites=1')
      setListings(data.listings)
    } catch {
      toastError()
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const toastError = () => {
    import('sonner').then(({ toast }) => toast.error('Could not load your saved items.'))
  }

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Heart size={44} className="mx-auto text-[#2E7D32] dark:text-[#6FBF73]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">Sign in to see your saved items</h1>
        <p className="mt-2 text-muted-foreground">Tap the ♥ on any listing to keep an eye on it.</p>
        <Button onClick={() => navigate('/')} className="mt-6 rounded-full bg-[#1B5E20] text-[#FFFDF5] hover:bg-[#124116]">
          {t('back_to_market')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeading title={t('saved')} subtitle="Produce you are watching. Go make an offer before someone else does." />
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Nothing saved yet"
          subtitle="Tap the heart on any listing and it will wait for you here."
          action={
            <Button onClick={() => navigate('/')} className="rounded-full bg-[#1B5E20] text-[#FFFDF5] hover:bg-[#124116]">
              Browse the market
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} onFavoriteChange={(_id, fav) => {
              if (!fav) setListings((prev) => prev.filter((x) => x.id !== _id))
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
