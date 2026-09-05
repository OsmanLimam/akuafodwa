'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Eye,
  PackageSearch,
  MessageSquareText,
  Handshake,
  MoreVertical,
  Pencil,
  Trash2,
  BadgeDollarSign,
  RotateCcw,
  Plus,
  Pin,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatGHS, timeAgo } from '@/lib/constants'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { EmptyState, SectionHeading, StatusBadge } from './misc'
import { EditListingDialog } from './edit-listing-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function MyListingsView() {
  const { user, userLoading, navigate, t } = useApp()
  const [listings, setListings] = useState<ApiListing[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ALL' | 'ACTIVE' | 'SOLD'>('ALL')
  const [editListing, setEditListing] = useState<ApiListing | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiListing | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api<{ listings: ApiListing[] }>(
        `/api/listings?sellerId=${user.id}&status=ALL&pageSize=48`
      )
      setListings(data.listings)
    } catch {
      toast.error('Could not load your listings.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const filtered = useMemo(
    () => (tab === 'ALL' ? listings : listings.filter((l) => l.status === tab)),
    [listings, tab]
  )

  const stats = useMemo(
    () => ({
      active: listings.filter((l) => l.status === 'ACTIVE').length,
      sold: listings.filter((l) => l.status === 'SOLD').length,
      views: listings.reduce((sum, l) => sum + l.views, 0),
    }),
    [listings]
  )

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <PackageSearch size={44} className="mx-auto text-[#2E7D32] dark:text-[#6FBF73]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">Sign in to manage your stall</h1>
        <p className="mt-2 text-muted-foreground">Your listings, offers and deals live here.</p>
        <Button onClick={() => navigate('/')} className="mt-6 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
          Back to the market
        </Button>
      </div>
    )
  }

  const setStatus = async (listing: ApiListing, status: string) => {
    try {
      await api(`/api/listings/${listing.id}`, { method: 'PATCH', json: { status } })
      toast.success(status === 'SOLD' ? 'Marked as sold. Well done! 🎉' : 'Listing is live again.')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update.')
    }
  }

  const remove = async (listing: ApiListing) => {
    try {
      await api(`/api/listings/${listing.id}`, { method: 'DELETE' })
      toast.success('Listing deleted.')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeading
        title="My listings"
        subtitle="Your stall at a glance. Manage produce, prices and offers."
        action={
          <Button
            onClick={() => navigate('/sell')}
            className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
          >
            <Plus size={16} className="mr-1.5" /> New listing
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<PackageSearch size={18} />} label="Active listings" value={stats.active} />
        <StatCard icon={<BadgeDollarSign size={18} />} label="Sold" value={stats.sold} />
        <StatCard icon={<Eye size={18} />} label="Total views" value={stats.views} />
        <StatCard icon={<MessageSquareText size={18} />} label="Open offers" value="→" isLink onClick={() => navigate('/inbox')} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-5">
        <TabsList className="rounded-full bg-muted p-1">
          <TabsTrigger value="ALL" className="rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
            All ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="ACTIVE" className="rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
            Active ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="SOLD" className="rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
            Sold ({stats.sold})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={listings.length === 0 ? 'Your stall is empty' : 'Nothing in this tab'}
          subtitle={
            listings.length === 0
              ? 'Put your first produce on the market: yam, maize, chicken, anything agric.'
              : 'Switch tabs to see your other listings.'
          }
          action={
            <Button onClick={() => navigate('/sell')} className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
              <Plus size={16} className="mr-1.5" /> List produce now
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => navigate(`/listing/${l.id}`)}
                className="relative h-24 w-full sm:h-20 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted"
                aria-label={`View ${l.title}`}
              >
                {l.images[0] && (
                  <Image src={l.images[0].url} alt="" fill sizes="112px" className="object-cover" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate(`/listing/${l.id}`)}
                    className="font-semibold hover:text-[#2E7D32] dark:hover:text-[#6FBF73] transition-colors truncate max-w-full sm:max-w-md text-left"
                  >
                    {l.title}
                  </button>
                  <StatusBadge status={l.status} />
                  {l.isPremium && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FBC02D] px-2 py-0.5 text-[10px] font-semibold text-[#1F2937]">
                      <Pin size={10} className="rotate-45" aria-hidden="true" /> Premium
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-display font-bold text-[#1B5E20] dark:text-[#EDF7EE]">{formatGHS(l.price)}</span>
                  <span> / {l.unit} · {l.quantity} {l.unit} available</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {l.category.name} · {l.city ? `${l.city}, ` : ''}{l.region} · listed {timeAgo(l.createdAt)} · {l.views} views
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#FBC02D] text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20"
                  onClick={() => navigate(`/inbox?listing=${l.id}`)}
                >
                  <MessageSquareText size={14} className="mr-1.5" />
                  Offers
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-[#FBC02D] text-[#124116] dark:text-[#6FBF73]" aria-label="More actions">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-48">
                    <DropdownMenuItem onClick={() => setEditListing(l)}>
                      <Pencil size={14} className="mr-2" /> {t('edit_listing')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatus(l, l.status === 'SOLD' ? 'ACTIVE' : 'SOLD')}>
                      {l.status === 'SOLD' ? (
                        <>
                          <RotateCcw size={14} className="mr-2" /> Relist (active)
                        </>
                      ) : (
                        <>
                          <Handshake size={14} className="mr-2" /> Mark as sold
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteTarget(l)} className="text-red-600 focus:text-red-700">
                      <Trash2 size={14} className="mr-2" /> Delete listing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog (full edit: everything except category & photos) */}
      {editListing && (
        <EditListingDialog
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSaved={(updated) => {
            setEditListing(null)
            // Apply the server-returned listing right away — no stale UI.
            // The PATCH response omits the seller relation, so spreading the
            // previous row first keeps it while refreshing every edited field.
            setListings((prev) =>
              prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
            )
          }}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the listing and its photos permanently. Existing conversations about it will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && remove(deleteTarget)}
              className="rounded-full bg-red-700 hover:bg-red-800"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  isLink,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  isLink?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isLink}
      className={cn(
        'flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 text-left shadow-sm',
        isLink && 'hover:border-[#2E7D32]/50 hover:shadow transition-all'
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-[#2E7D32] dark:text-[#6FBF73]">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">{value}</p>
      </div>
    </button>
  )
}
