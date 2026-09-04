'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/constants'
import { SELLER_TYPES, sellerTypeLabel } from '@/lib/types'
import type { ApiReview } from '@/lib/types'
import { useApp } from './store'
import { AvatarInitials, SectionHeading, Stars } from './misc'
import { NotificationsSection } from './notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  LogOut,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  Clock3,
  ShieldX,
  IdCard,
  Lock,
} from 'lucide-react'

const DOC_TYPES = [
  { value: 'GHANA_CARD', label: 'Ghana Card (national ID)' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's licence" },
  { value: 'BUSINESS_REGISTRATION', label: 'Business registration certificate' },
]

export function ProfileView() {
  const { user, userLoading, navigate, openAuth, refreshUser, logout, t } = useApp()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sellerType, setSellerType] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(user.phone ?? '')
      setSellerType(user.sellerType ?? '')
      setBusinessName(user.businessName ?? '')
      setBio(user.bio ?? '')
    }
  }, [user])

  const loadReviews = useCallback(async () => {
    if (!user) return
    try {
      const data = await api<{ reviews: ApiReview[]; avg: number | null }>(
        `/api/reviews?sellerId=${user.id}`
      )
      setReviews(data.reviews)
      setAvg(data.avg)
    } catch {
      /* ignore */
    }
  }, [user])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">You are not signed in</h1>
        <p className="mt-2 text-muted-foreground">Sign in to manage your profile and see your ratings.</p>
        <Button onClick={() => openAuth('login')} className="mt-6 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
          Sign in
        </Button>
      </div>
    )
  }

  if (!user) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/auth/me', {
        method: 'PATCH',
        json: { name, phone, sellerType, businessName, bio },
      })
      await refreshUser()
      toast.success('Profile updated. ✅')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <SectionHeading title={t('my_profile')} subtitle="Your AkuafoDwa identity. Buyers and sellers see this." />

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <AvatarInitials name={user.name} className="h-16 w-16 text-xl" />
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">{user.name}</h2>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Stars value={avg} />
                  <span>{avg ? `${avg.toFixed(1)} seller rating · ${reviews.length} review(s)` : 'No reviews yet'}</span>
                </div>
                {sellerTypeLabel(user.sellerType) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {sellerTypeLabel(user.sellerType)}
                    {user.businessName ? ` · ${user.businessName}` : ''}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">Edit details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pf-name">{t('full_name')}</Label>
                <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 bg-background" minLength={2} maxLength={80} required />
              </div>
              <div>
                <Label htmlFor="pf-phone">{t('phone_number')}</Label>
                <Input
                  id="pf-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 024 000 0000"
                  className="mt-1.5 bg-background"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Shown to your deal partner only after a deal is agreed.
                </p>
              </div>
              <div>
                <Label>I am a...</Label>
                <Select value={sellerType || undefined} onValueChange={setSellerType}>
                  <SelectTrigger className="mt-1.5 bg-background" aria-label="Seller type">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SELLER_TYPES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pf-biz">Business or farm name</Label>
                <Input
                  id="pf-biz"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Mensah Family Farm"
                  className="mt-1.5 bg-background"
                  maxLength={120}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pf-bio">About your farm or business</Label>
              <Textarea
                id="pf-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell buyers what you produce, where you farm, how long you have been trading..."
                rows={3}
                className="mt-1.5 bg-background resize-none"
                maxLength={500}
              />
            </div>
            <Button type="submit" disabled={saving} className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
              {saving ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
              Save changes
            </Button>
          </form>

          <IdentityVerificationSection userId={user.id} identityStatus={user.identityStatus} verificationNote={user.verificationNote} onRefresh={refreshUser} />
        </div>

        <div className="space-y-6">
          <NotificationsSection />

          {user.role === 'ADMIN' && (
            <div className="rounded-2xl border border-[#2E7D32]/30 bg-muted p-5">
              <p className="flex items-center gap-2 font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">
                <ShieldCheck size={17} /> Administrator
              </p>
              <p className="mt-1 text-xs text-muted-foreground">You can moderate listings and review verification requests.</p>
              <Button onClick={() => navigate('/admin')} size="sm" className="mt-3 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
                Open admin dashboard
              </Button>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">Reviews about you</h3>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No reviews yet. Complete deals and happy buyers will rate you here.
              </p>
            ) : (
              <div className="nice-scroll mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-background/50 border border-[#FBC02D]/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.buyer.name}</span>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">&ldquo;{r.comment}&rdquo;</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      on &ldquo;{r.listingTitle}&rdquo; · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ChangePasswordSection />

          <Button
            variant="outline"
            onClick={async () => {
              await logout()
              toast('Signed out. Medaase!')
              navigate('/')
            }}
            className="w-full rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            <LogOut size={15} className="mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

function IdentityVerificationSection({
  userId,
  identityStatus,
  verificationNote,
  onRefresh,
}: {
  userId: string
  identityStatus: string
  verificationNote: string | null
  onRefresh: () => Promise<void>
}) {
  const [docType, setDocType] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!docType) {
      toast.error('Please choose which document you are submitting.')
      return
    }
    if (!file) {
      toast.error('Please attach a clear photo or scan of the document.')
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('docType', docType)
      const res = await api<{ message: string }>('/api/verification/submit', {
        method: 'POST',
        body: form,
      })
      toast.success(res.message ?? 'Documents received.')
      await onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit document.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE] flex items-center gap-2">
            <IdCard size={17} className="text-[#2E7D32] dark:text-[#6FBF73]" /> Identity verification
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Verified sellers get more responses: buyers can see the &ldquo;Identity verified&rdquo; badge on
            your listings and profile.
          </p>
        </div>
        <StatusPill status={identityStatus} />
      </div>

      {identityStatus === 'VERIFIED' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-medium flex items-center gap-1.5">
            <BadgeCheck size={15} /> Your identity is verified.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
            The verified badge now shows next to your name on your listings. Thank you for keeping
            the market trustworthy.
          </p>
        </div>
      )}

      {identityStatus === 'PENDING' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium flex items-center gap-1.5">
            <Clock3 size={15} /> Verification in progress
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/80">
            We received your document and our team is reviewing it. This usually takes up to 2
            working days. You can keep selling while you wait.
          </p>
        </div>
      )}

      {identityStatus === 'REJECTED' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-100">
          <p className="font-medium flex items-center gap-1.5">
            <ShieldX size={15} /> Verification was not approved
          </p>
          {verificationNote && (
            <p className="mt-1 text-xs leading-relaxed text-red-800/80 dark:text-red-200/80">Reviewer note: {verificationNote}</p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-red-800/80 dark:text-red-200/80">
            You can submit a new document below if you believe this was a mistake or your details
            have changed.
          </p>
        </div>
      )}

      {(identityStatus === 'UNVERIFIED' || identityStatus === 'REJECTED') && (
        <form onSubmit={submit} className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Document type</Label>
              <Select value={docType || undefined} onValueChange={setDocType}>
                <SelectTrigger className="mt-1.5 bg-background" aria-label="Document type">
                  <SelectValue placeholder="Choose document" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {DOC_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vf-file">Document image</Label>
              <Input
                id="vf-file"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1.5 bg-background"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#FBC02D]/60 bg-background/50 p-3.5 text-xs leading-relaxed text-[#124116] dark:text-[#A3C4A8]">
            <p className="font-semibold flex items-center gap-1.5">
              <Lock size={12} /> How we handle your document
            </p>
            <ul className="mt-1.5 space-y-1 list-disc list-inside text-[11px] text-[#124116]/85 dark:text-[#D7EED9]/85">
              <li>Why we ask: to confirm you are a real person and protect buyers from fraud.</li>
              <li>What to upload: a clear photo or scan of one of the documents listed above.</li>
              <li>Who can see it: only trained AkuafoDwa review staff. It is never shown on your public profile and never shared with other users.</li>
              <li>What happens next: we review it (usually within 2 working days) and update your status. You can keep buying and selling while you wait.</li>
              <li>We only collect this document for verification. We do not ask for passwords, PINs, or financial details.</li>
            </ul>
          </div>

          <Button type="submit" disabled={busy} className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
            {busy ? <Loader2 size={15} className="mr-2 animate-spin" /> : <ShieldCheck size={15} className="mr-2" />}
            Submit for verification
          </Button>
        </form>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
        <BadgeCheck size={12} /> Identity verified
      </span>
    )
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">
        <Clock3 size={12} /> Pending review
      </span>
    )
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 shrink-0">
        <ShieldX size={12} /> Not approved
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground shrink-0">
      Not verified
    </span>
  )
}

/*
 * Change password — plain-language form that proves the current password
 * server-side, saves the new one, and signs every OTHER device out.
 */
function ChangePasswordSection() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next.length < 8) {
      toast.error('Your new password needs at least 8 characters.')
      return
    }
    if (next !== confirm) {
      toast.error('The two new passwords do not match. Please check them.')
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      toast.success('Password changed. Other devices have been signed out. 🔒')
      setOpen(false)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change the password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-background"
      >
        <Lock size={15} className="text-primary" />
        Change my password
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-background/50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lock size={15} className="text-primary" /> Change my password
      </p>
      <div>
        <Label htmlFor="pw-current">Current password</Label>
        <Input
          id="pw-current"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1.5 bg-background"
        />
      </div>
      <div>
        <Label htmlFor="pw-new">New password (at least 8 characters)</Label>
        <Input
          id="pw-new"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          required
          className="mt-1.5 bg-background"
        />
      </div>
      <div>
        <Label htmlFor="pw-confirm">Repeat the new password</Label>
        <Input
          id="pw-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className="mt-1.5 bg-background"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="h-10 flex-1 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] font-semibold text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116]">
          {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Save new password'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false)
            setCurrent('')
            setNext('')
            setConfirm('')
          }}
          className="h-10 rounded-full"
        >
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        After saving, every other phone or computer signed into this account will be signed out.
      </p>
    </form>
  )
}
