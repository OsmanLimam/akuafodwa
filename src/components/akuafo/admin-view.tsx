'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Users,
  Store,
  Handshake,
  Star,
  ShieldCheck,
  Search,
  Ban,
  CheckCircle2,
  Trash2,
  IdCard,
  ExternalLink,
  Pin,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatGHS, timeAgo } from '@/lib/constants'
import { sellerTypeLabel } from '@/lib/types'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { EmptyState, SectionHeading, StatusBadge } from './misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'

interface AdminStats {
  users: number
  listings: number
  activeListings: number
  soldListings: number
  threads: number
  agreed: number
  completed: number
  categories: number
  reviews: number
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: { listings: number }
}

interface VerificationUser {
  id: string
  name: string
  email: string
  phone: string | null
  sellerType: string | null
  businessName: string | null
  identityStatus: string
  idDocumentType: string | null
  verifiedAt: string | null
  verificationNote: string | null
  createdAt: string
  _count: { listings: number }
}

const DOC_LABELS: Record<string, string> = {
  GHANA_CARD: 'Ghana Card',
  PASSPORT: 'Passport',
  DRIVERS_LICENSE: "Driver's licence",
  BUSINESS_REGISTRATION: 'Business registration',
}

export function AdminView() {
  const { user, userLoading, navigate } = useApp()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [tab, setTab] = useState<'listings' | 'users' | 'verifications'>('listings')
  const [listings, setListings] = useState<ApiListing[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [verifications, setVerifications] = useState<VerificationUser[]>([])
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SOLD' | 'TAKEN_DOWN'>('ALL')
  const [deleteTarget, setDeleteTarget] = useState<ApiListing | null>(null)
  const [reviewTarget, setReviewTarget] = useState<VerificationUser | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const reload = useCallback(() => {
    api<{ stats: AdminStats }>('/api/admin/stats').then((d) => setStats(d.stats)).catch(() => {})
    if (tab === 'listings') {
      const sp = new URLSearchParams()
      if (q) sp.set('q', q)
      if (statusFilter !== 'ALL') sp.set('status', statusFilter)
      api<{ listings: ApiListing[] }>(`/api/admin/listings?${sp.toString()}`)
        .then((d) => setListings(d.listings))
        .catch(() => {})
    } else if (tab === 'users') {
      const sp = new URLSearchParams()
      if (q) sp.set('q', q)
      api<{ users: AdminUser[] }>(`/api/admin/users?${sp.toString()}`)
        .then((d) => setUsers(d.users))
        .catch(() => {})
    } else {
      api<{ users: VerificationUser[] }>('/api/admin/verifications')
        .then((d) => setVerifications(d.users))
        .catch(() => {})
    }
  }, [tab, q, statusFilter])

  // Debounced data loading (all setState calls happen inside async callbacks)
  useEffect(() => {
    if (!isAdmin) return
    const t = setTimeout(() => {
      api<{ stats: AdminStats }>('/api/admin/stats')
        .then((d) => setStats(d.stats))
        .catch(() => {})
      if (tab === 'listings') {
        const sp = new URLSearchParams()
        if (q) sp.set('q', q)
        if (statusFilter !== 'ALL') sp.set('status', statusFilter)
        api<{ listings: ApiListing[] }>(`/api/admin/listings?${sp.toString()}`)
          .then((d) => setListings(d.listings))
          .catch(() => {})
      } else if (tab === 'users') {
        const sp = new URLSearchParams()
        if (q) sp.set('q', q)
        api<{ users: AdminUser[] }>(`/api/admin/users?${sp.toString()}`)
          .then((d) => setUsers(d.users))
          .catch(() => {})
      } else {
        api<{ users: VerificationUser[] }>('/api/admin/verifications')
          .then((d) => setVerifications(d.users))
          .catch(() => {})
      }
    }, 300)
    return () => clearTimeout(t)
  }, [isAdmin, tab, q, statusFilter])

  if (!userLoading && (!user || user.role !== 'ADMIN')) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <ShieldCheck size={44} className="mx-auto text-[#2E7D32] dark:text-[#6FBF73]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">Admins only</h1>
        <p className="mt-2 text-muted-foreground">This area is restricted to AkuafoDwa administrators.</p>
        <Button onClick={() => navigate('/')} className="mt-6 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
          Back to the market
        </Button>
      </div>
    )
  }

  const setStatus = async (listing: ApiListing, status: 'TAKEN_DOWN' | 'ACTIVE_RESTORE') => {
    try {
      await api(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        json: { status: status === 'TAKEN_DOWN' ? 'TAKEN_DOWN' : 'ACTIVE' },
      })
      toast.success(status === 'TAKEN_DOWN' ? 'Listing taken down.' : 'Listing restored.')
      reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed.')
    }
  }

  const togglePremium = async (listing: ApiListing) => {
    try {
      await api(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        json: { isPremium: !listing.isPremium },
      })
      toast.success(listing.isPremium ? 'Listing unpinned.' : 'Listing pinned to the top of the market.')
      reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed.')
    }
  }

  const remove = async (listing: ApiListing) => {
    try {
      await api(`/api/listings/${listing.id}`, { method: 'DELETE' })
      toast.success('Listing deleted permanently.')
      setDeleteTarget(null)
      reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  const decideVerification = async (target: VerificationUser, decision: 'APPROVE' | 'REJECT') => {
    try {
      await api(`/api/admin/verifications/${target.id}`, {
        method: 'POST',
        json: { decision, note: reviewNote || undefined },
      })
      toast.success(decision === 'APPROVE' ? `${target.name} is now verified.` : 'Verification rejected.')
      setReviewTarget(null)
      setReviewNote('')
      reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeading
        title="Admin dashboard"
        subtitle="Platform health at a glance. Moderate listings and monitor activity."
      />

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={<Users size={18} />} label="Users" value={stats.users} />
          <StatCard icon={<Store size={18} />} label="Listings" value={stats.listings} sub={`${stats.activeListings} active · ${stats.soldListings} sold`} />
          <StatCard icon={<Handshake size={18} />} label="Deal threads" value={stats.threads} />
          <StatCard icon={<Handshake size={18} />} label="Agreed / completed" value={`${stats.agreed}/${stats.completed}`} />
          <StatCard icon={<Star size={18} />} label="Reviews" value={stats.reviews} />
          <StatCard icon={<Store size={18} />} label="Categories" value={stats.categories} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="rounded-full bg-muted p-1">
            <TabsTrigger value="listings" className="rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
              Listings
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
              Users
            </TabsTrigger>
            <TabsTrigger value="verifications" className="rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
              Verifications
              {verifications.some((v) => v.identityStatus === 'PENDING') && (
                <span className="ml-1.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {verifications.filter((v) => v.identityStatus === 'PENDING').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'listings' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" className="w-48 rounded-full bg-card pl-8" />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList className="rounded-full bg-muted p-1">
                {(['ALL', 'ACTIVE', 'SOLD', 'TAKEN_DOWN'] as const).map((s) => (
                  <TabsTrigger key={s} value={s} className="rounded-full px-3 text-xs data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
                    {s === 'TAKEN_DOWN' ? 'Down' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
        {tab === 'users' && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="w-48 rounded-full bg-card pl-8" />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {tab === 'listings' ? (
          <div className="nice-scroll max-h-[62vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/50 hover:bg-background/50">
                  <TableHead className="w-16">Photo</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <span className="relative block h-10 w-12 overflow-hidden rounded-lg bg-muted">
                        {l.images[0] && <Image src={l.images[0].url} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-56">
                      <button onClick={() => navigate(`/listing/${l.id}`)} className="block truncate font-medium hover:text-[#2E7D32] dark:hover:text-[#6FBF73] text-left">
                        {l.title}
                      </button>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {l.category.name}
                        {l.isPremium && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FBC02D] px-1.5 py-px text-[10px] font-semibold text-[#1F2937]">
                            <Pin size={9} className="rotate-45" aria-hidden="true" /> Premium
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{l.seller.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-medium">{formatGHS(l.price)}<span className="text-muted-foreground">/{l.unit}</span></TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(l.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          className={cn(
                            'h-8 w-8 rounded-full',
                            l.isPremium
                              ? 'border-[#C49000] bg-[#FBC02D]/20 text-[#8a6500] hover:bg-[#FBC02D]/40'
                              : 'border-[#DDE5DE] text-[#52605A] hover:bg-[#E8F5E9] dark:border-[#2C5236] dark:text-[#A3C4A8] dark:hover:bg-[#16351F]'
                          )}
                          onClick={() => togglePremium(l)}
                          aria-label={l.isPremium ? 'Unpin listing' : 'Pin listing to top'}
                          title={l.isPremium ? 'Unpin listing' : 'Pin listing to top'}
                        >
                          <Pin size={14} className={l.isPremium ? '' : 'rotate-45'} />
                        </Button>
                        {l.status !== 'TAKEN_DOWN' ? (
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40" onClick={() => setStatus(l, 'TAKEN_DOWN')} aria-label="Take down">
                            <Ban size={14} />
                          </Button>
                        ) : (
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40" onClick={() => setStatus(l, 'ACTIVE_RESTORE')} aria-label="Restore">
                            <CheckCircle2 size={14} />
                          </Button>
                        )}
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40" onClick={() => setDeleteTarget(l)} aria-label="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {listings.length === 0 && (
              <div className="p-6"><EmptyState title="No listings found" subtitle="Try another search or status filter." /></div>
            )}
          </div>
        ) : tab === 'users' ? (
          <div className="nice-scroll max-h-[62vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/50 hover:bg-background/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Listings</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}{u.role === 'ADMIN' && <span className="ml-2 rounded-full bg-[#1B5E20] px-2 py-0.5 text-[10px] font-semibold text-[#FFFDF5]">ADMIN</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.role}</TableCell>
                    <TableCell className="text-sm">{u._count.listings}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && (
              <div className="p-6"><EmptyState title="No users found" /></div>
            )}
          </div>
        ) : (
          <div className="nice-scroll max-h-[62vh] overflow-auto">
            {verifications.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No verification requests yet"
                  subtitle="When sellers submit identity documents for review, they appear here."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/50 hover:bg-background/50">
                    <TableHead>Account</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.email}</p>
                        {sellerTypeLabel(v.sellerType) && (
                          <p className="text-[11px] text-muted-foreground">
                            {sellerTypeLabel(v.sellerType)}{v.businessName ? ` · ${v.businessName}` : ''}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.idDocumentType ? (
                          <a
                            href={`/api/admin/verifications/${v.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#2E7D32] dark:text-[#6FBF73] underline-offset-2 hover:underline"
                          >
                            {DOC_LABELS[v.idDocumentType] ?? v.idDocumentType} <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">None on file</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.identityStatus === 'PENDING' && (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">Pending</span>
                        )}
                        {v.identityStatus === 'VERIFIED' && (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">Verified</span>
                        )}
                        {v.identityStatus === 'REJECTED' && (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">Rejected</span>
                        )}
                        {v.verificationNote && (
                          <p className="mt-0.5 max-w-40 truncate text-[11px] text-muted-foreground" title={v.verificationNote}>{v.verificationNote}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{v._count.listings}</TableCell>
                      <TableCell className="text-right">
                        {v.identityStatus === 'PENDING' ? (
                          <Button
                            size="sm"
                            className="h-8 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
                            onClick={() => { setReviewTarget(v); setReviewNote('') }}
                          >
                            <IdCard size={14} className="mr-1" /> Review
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full"
                            onClick={() => { setReviewTarget(v); setReviewNote('') }}
                          >
                            Re-review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(reviewTarget)} onOpenChange={(v) => !v && setReviewTarget(null)}>
        <AlertDialogContent className="rounded-3xl sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IdCard size={18} className="text-[#2E7D32] dark:text-[#6FBF73]" />
              Verify {reviewTarget?.name}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Open the submitted document and check that the name matches the account, then
                  decide. Documents are visible to admins only and are never shown publicly.
                </p>
                {reviewTarget?.idDocumentType && (
                  <a
                    href={`/api/admin/verifications/${reviewTarget.id}/document`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#FBC02D] bg-background/60 px-3.5 py-1.5 text-xs font-semibold text-[#124116] dark:text-[#6FBF73] hover:bg-[#E8F5E9] dark:hover:bg-[#16351F]"
                  >
                    View {DOC_LABELS[reviewTarget.idDocumentType] ?? reviewTarget.idDocumentType} <ExternalLink size={12} />
                  </a>
                )}
                <Input
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Optional note for the seller (visible to them)"
                  maxLength={300}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewTarget && decideVerification(reviewTarget, 'REJECT')}
              className="rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              Reject
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => reviewTarget && decideVerification(reviewTarget, 'APPROVE')}
              className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Approve verification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}” permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Admin deletion is irreversible and removes related photos and conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && remove(deleteTarget)} className="rounded-full bg-red-700 hover:bg-red-800">
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-[#2E7D32] dark:text-[#6FBF73]">{icon}</span>
      <p className="mt-2.5 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
