'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Search, MapPin, SlidersHorizontal, X, Sprout, ChevronLeft, ChevronRight, HandCoins, BadgeCheck, Camera, MessagesSquare } from 'lucide-react'
import { api } from '@/lib/api'
import { GHANA_REGIONS } from '@/lib/constants'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { ListingCard } from './listing-card'
import { EmptyState, ListingCardSkeleton, SectionHeading } from './misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

interface Filters {
  q: string
  category: string
  region: string
  minPrice: string
  maxPrice: string
  sort: string
  page: number
}

const DEFAULT_FILTERS: Filters = {
  q: '',
  category: '',
  region: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
  page: 1,
}

export function BrowseView() {
  const { categories, navigate, user, t } = useApp()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [listings, setListings] = useState<ApiListing[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [totalAll, setTotalAll] = useState<number | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (filters.q) sp.set('q', filters.q)
      if (filters.category) sp.set('category', filters.category)
      if (filters.region) sp.set('region', filters.region)
      if (filters.minPrice) sp.set('minPrice', filters.minPrice)
      if (filters.maxPrice) sp.set('maxPrice', filters.maxPrice)
      if (filters.sort) sp.set('sort', filters.sort)
      sp.set('page', String(filters.page))
      sp.set('pageSize', String(PAGE_SIZE))
      const data = await api<{ listings: ApiListing[]; total: number; pages: number }>(
        `/api/listings?${sp.toString()}`
      )
      setListings(data.listings)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setListings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    api<{ total: number }>('/api/listings?pageSize=1')
      .then((d) => setTotalAll(d.total))
      .catch(() => setTotalAll(null))
  }, [filters])

  const activeCategory = categories.find((c) => c.slug === filters.category)
  const activeFiltersCount =
    (filters.category ? 1 : 0) + (filters.region ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setFilters((f) => ({ ...f, q: searchInput, page: 1 }))
  }

  const goToPage = (p: number) => {
    setFilters((f) => ({ ...f, page: p }))
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const heroImage = '/uploads/seed/hero.jpg'

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-[#124116]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C2410] via-[#1B5E20] to-[#2E7D32]" aria-hidden="true" />
        <div className="absolute inset-0 hero-texture" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-[#FBC02D] ring-1 ring-[#FBC02D]/30 backdrop-blur">
                <Sprout size={14} />
                Ghana&apos;s farmers market, online
              </p>
              <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#FFFDF5] text-balance">
                {t('hero_line1')}{' '}
                <em className="italic text-[#FBC02D]">{t('hero_line2')}</em>
              </h1>
              <p className="mt-4 max-w-xl text-base text-[#E8F5E9]/75 leading-relaxed">
                {t('hero_body')}
              </p>

              <form onSubmit={submitSearch} className="mt-7 flex max-w-xl gap-2" role="search">
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52605A]" aria-hidden="true" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="h-12 rounded-full border-transparent bg-[#FFFDF5]! pl-11 pr-4 text-[15px] text-[#1F2937] placeholder:text-[#52605A]/70 shadow-lg focus-visible:ring-[#FBC02D]"
                    aria-label="Search the market"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-12 rounded-full bg-[#FBC02D] px-6 font-semibold text-[#1F2937] hover:bg-[#FFFDF5] shadow-lg"
                >
                  {t('search')}
                </Button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#E8F5E9]/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FBC02D]" />
                  {totalAll ?? '…'} {t('live_listings')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FBC02D]" /> {t('regions_covered')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FBC02D]" /> {t('free_to_list')}
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] ring-1 ring-[#FBC02D]/25 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <Image
                  src={heroImage}
                  alt="Vibrant Ghanaian market stall with fresh produce"
                  fill
                  priority
                  sizes="40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C2410]/55 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-[#124116]/70 backdrop-blur px-4 py-3 text-[#FFFDF5]">
                  <p className="font-display italic text-sm">&ldquo;Dwa a ɛdi kan&rdquo;: the first market of its kind.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-1.5 kente-stripes" aria-hidden="true" />
      </section>

      {/* ---------- Category chips ---------- */}
      <section className="sticky top-[68px] z-30 bg-background/95 backdrop-blur border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="nice-scroll flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
            <CategoryChip
              label={t('all_produce')}
              icon="🧺"
              active={!filters.category}
              onClick={() => setFilters((f) => ({ ...f, category: '', page: 1 }))}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                count={c._count?.listings ?? 0}
                active={filters.category === c.slug}
                onClick={() => setFilters((f) => ({ ...f, category: f.category === c.slug ? '' : c.slug, page: 1 }))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Filters + results ---------- */}
      <section ref={resultsRef} className="mx-auto max-w-7xl px-4 sm:px-6 py-8 scroll-mt-32">
        <SectionHeading
          title={activeCategory ? activeCategory.name : t('fresh_on_the_market')}
          subtitle={
            loading
              ? t('loading')
              : `${total} listing${total === 1 ? '' : 's'}${filters.q ? ` matching “${filters.q}”` : ''}`
          }
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((s) => !s)}
                className={cn('rounded-full border-[#FBC02D] text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20', showFilters && 'bg-[#FBC02D]/30')}
              >
                <SlidersHorizontal size={15} className="mr-1.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1B5E20] text-[11px] font-bold text-[#FFFDF5]">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              <Select
                value={filters.sort}
                onValueChange={(v) => setFilters((f) => ({ ...f, sort: v, page: 1 }))}
              >
                <SelectTrigger className="w-[150px] rounded-full border-[#FBC02D] bg-card text-sm h-9" aria-label="Sort listings">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="price_asc">Price: low → high</SelectItem>
                  <SelectItem value="price_desc">Price: high → low</SelectItem>
                  <SelectItem value="popular">Most viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {showFilters && (
          <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Region</label>
              <Select
                value={filters.region || 'ALL'}
                onValueChange={(v) => setFilters((f) => ({ ...f, region: v === 'ALL' ? '' : v, page: 1 }))}
              >
                <SelectTrigger className="bg-background rounded-xl" aria-label="Filter by region">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  <SelectItem value="ALL">All regions</SelectItem>
                  {GHANA_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min price (GH₵)</label>
              <Input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value, page: 1 }))}
                placeholder="0"
                className="bg-background rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max price (GH₵)</label>
              <Input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value, page: 1 }))}
                placeholder="Any"
                className="bg-background rounded-xl"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS)
                  setSearchInput('')
                }}
                className="rounded-xl text-[#2E7D32] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20"
              >
                <X size={15} className="mr-1.5" /> Clear all filters
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('no_listings_found')}
            subtitle="Try a different search, clear your filters, or be the first to list this produce."
            action={
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full border-[#FBC02D] text-[#124116] dark:text-[#6FBF73]" onClick={() => { setFilters(DEFAULT_FILTERS); setSearchInput('') }}>
                  Clear filters
                </Button>
                {user && (
                  <Button className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]" onClick={() => navigate('/sell')}>
                    <HandCoins size={15} className="mr-1.5" /> List your produce
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={filters.page <= 1}
                  onClick={() => goToPage(filters.page - 1)}
                  className="rounded-full border-[#FBC02D] disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                </Button>
                {Array.from({ length: pages }).slice(0, 9).map((_, i) => {
                  const p = i + 1
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={cn(
                        'h-9 w-9 rounded-full text-sm font-medium transition-colors',
                        p === filters.page
                          ? 'bg-[#1B5E20] text-[#FFFDF5]'
                          : 'text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/30 dark:hover:bg-[#FBC02D]/20'
                      )}
                      aria-label={`Page ${p}`}
                      aria-current={p === filters.page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={filters.page >= pages}
                  onClick={() => goToPage(filters.page + 1)}
                  className="rounded-full border-[#FBC02D] disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={17} />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------- How the market works ---------- */}
      <section aria-labelledby="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="rounded-3xl border border-border bg-card px-5 py-8 shadow-sm md:px-10 md:py-10">
          <h2 id="how-it-works" className="font-display text-2xl md:text-3xl font-bold text-foreground text-center text-balance">
            How the market works
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-xl mx-auto">
            Three steps between the farm gate and a done deal. No middleman sets the price, you do.
          </p>
          <ol className="mt-8 grid gap-7 sm:grid-cols-3 sm:gap-5">
            <li className="flex flex-col items-center text-center">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-base font-bold bg-[#1B5E20] text-[#FFFDF5] dark:bg-[#4CAF50] dark:text-[#071A0C]"
                aria-hidden="true"
              >
                1
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Browse real stalls</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-w-xs">
                Every listing is a real farmer or trader, with their own photos, quantity and price in cedis.
              </p>
            </li>
            <li className="flex flex-col items-center text-center">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-base font-bold bg-[#1B5E20] text-[#FFFDF5] dark:bg-[#4CAF50] dark:text-[#071A0C]"
                aria-hidden="true"
              >
                2
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Make an offer</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-w-xs">
                Bid your price. The seller accepts, declines or counters, until both sides agree right here.
              </p>
            </li>
            <li className="flex flex-col items-center text-center">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-base font-bold bg-[#1B5E20] text-[#FFFDF5] dark:bg-[#4CAF50] dark:text-[#071A0C]"
                aria-hidden="true"
              >
                3
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Deal and connect</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-w-xs">
                Once a deal is agreed, phone numbers unlock and you finish on WhatsApp or a call. Directly.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ---------- Trust band ---------- */}
      <section aria-labelledby="why-trust" className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <h2 id="why-trust" className="sr-only">Why buyers and sellers trust AkuafoDwa</h2>
          <ul className="grid sm:grid-cols-3 sm:divide-x sm:divide-border">
            <li className="flex items-start gap-3.5 px-6 py-6">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBC02D]/40 dark:bg-[#4CAF50]/15" aria-hidden="true">
                <BadgeCheck size={19} className="text-[#124116] dark:text-[#6FBF73]" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">ID-verified sellers</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sellers can verify their identity with their Ghana Card, and you see the badge before you deal.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3.5 border-t border-border px-6 py-6 sm:border-t-0">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBC02D]/40 dark:bg-[#4CAF50]/15" aria-hidden="true">
                <Camera size={19} className="text-[#124116] dark:text-[#6FBF73]" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Real photos from the farm</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Every photo belongs to the seller who listed it. What you see on the stall is what you get.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3.5 border-t border-border px-6 py-6 sm:border-t-0">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBC02D]/40 dark:bg-[#4CAF50]/15" aria-hidden="true">
                <MessagesSquare size={19} className="text-[#124116] dark:text-[#6FBF73]" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">You deal directly</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  You negotiate with each other and settle on WhatsApp or a call. AkuafoDwa never takes a cut.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- Sell CTA band ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] px-6 py-10 md:px-12 md:py-12 shadow-xl">
          <div className="absolute inset-0 hero-texture opacity-60" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl md:text-4xl font-bold text-[#FFFDF5] text-balance">
                Have something to sell? <em className="italic text-[#FBC02D]">Dwa abɛn, the market is open.</em>
              </h2>
              <p className="mt-2 text-sm text-[#E8F5E9]/75 max-w-lg">
                Post your produce in two minutes, with your price and your quantity. Buyers come to you
                with offers. You accept only what works for you. Free to list.
              </p>
            </div>
            <Button
              onClick={() => navigate('/sell')}
              className="h-12 shrink-0 rounded-full bg-[#FFFDF5] px-7 font-semibold text-[#1B5E20] hover:bg-white shadow-lg"
            >
              <HandCoins size={17} className="mr-2" />
              Start selling
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function CategoryChip({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string
  icon?: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-[#1B5E20] bg-[#1B5E20] text-[#FFFDF5] shadow dark:border-[#4CAF50] dark:bg-[#4CAF50] dark:text-[#071A0C]'
          : 'border-[#DDE5DE] bg-card text-[#124116] dark:border-[#2C5236] dark:text-[#D7EED9] hover:border-[#2E7D32] hover:bg-[#FBC02D]/20'
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', active ? 'bg-white/20' : 'bg-[#E8F5E9] dark:bg-[#2C5236] dark:text-[#D7EED9]')}>
          {count}
        </span>
      )}
    </button>
  )
}
