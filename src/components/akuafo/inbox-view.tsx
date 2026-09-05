'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  MessageSquareText,
  ArrowLeft,
  Send,
  HandCoins,
  Phone,
  ShieldCheck,
  Star,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatGHS, timeAgo } from '@/lib/constants'
import { whatsappLink } from '@/lib/phone'
import type { ApiThread, ApiOfferMessage } from '@/lib/types'
import { useApp } from './store'
import { EmptyState, StatusBadge, Stars } from './misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function InboxView({ routeId, routeQuery }: { routeId?: string; routeQuery?: Record<string, string> }) {
  const { user, userLoading, navigate, refreshUnreadCounts, t } = useApp()
  const [threads, setThreads] = useState<ApiThread[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [activeId, setActiveId] = useState<string | null>(routeId ?? null)
  const [listingFilter, setListingFilter] = useState<string>(routeQuery?.listing ?? '')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      sp.set('role', role)
      if (listingFilter) sp.set('listingId', listingFilter)
      const data = await api<{ threads: ApiThread[] }>(`/api/threads?${sp.toString()}`)
      setThreads(data.threads)
    } catch {
      toast.error('Could not load your conversations.')
    } finally {
      setLoading(false)
    }
  }, [user, role, listingFilter])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  // Update active thread when hash changes to /inbox/{id}
  useEffect(() => {
    setActiveId(routeId ?? null)
    setListingFilter(routeQuery?.listing ?? '')
  }, [routeId, routeQuery?.listing])

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <MessageSquareText size={44} className="mx-auto text-[#2E7D32] dark:text-[#6FBF73]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">Sign in to see your offers</h1>
        <p className="mt-2 text-muted-foreground">All your negotiations and agreed deals live here.</p>
        <Button onClick={() => navigate('/')} className="mt-6 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
          {t('back_to_market')}
        </Button>
      </div>
    )
  }

  const activeThread = threads.find((t) => t.id === activeId) ?? null

  // Surgical list update: merge the changed thread in place instead of a full
  // refetch, so the list status badge stays in sync immediately after a mutation.
  const afterThreadUpdate = (updated?: ApiThread) => {
    if (updated) {
      setThreads((prev) => prev.map((th) => (th.id === updated.id ? { ...th, ...updated } : th)))
    }
    refreshUnreadCounts()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">{t('offers')}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Negotiate directly, agree inside AkuafoDwa, then contacts open to arrange payment and delivery.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Thread list */}
        <div className={cn('space-y-4', activeThread && 'hidden lg:block')}>
          <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <TabsList className="w-full rounded-full bg-muted p-1">
              <TabsTrigger value="buyer" className="flex-1 gap-1.5 rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
                <ShoppingBag size={14} /> {t('buying')}
              </TabsTrigger>
              <TabsTrigger value="seller" className="flex-1 gap-1.5 rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
                <Store size={14} /> {t('selling')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <EmptyState
              icon="inbox"
              title={role === 'buyer' ? 'No offers sent yet' : 'No offers received yet'}
              subtitle={
                role === 'buyer'
                  ? 'Browse the market and make your first offer, then negotiate from there.'
                  : 'When buyers make offers on your listings, they appear here.'
              }
              action={
                <Button
                  onClick={() => navigate('/')}
                  className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
                >
                  {role === 'buyer' ? 'Browse the market' : 'View my listings'}
                </Button>
              }
            />
          ) : (
            <div className="nice-scroll max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {threads.map((t) => (
                <ThreadListItem
                  key={t.id}
                  thread={t}
                  role={role}
                  active={t.id === activeId}
                  onClick={() => setActiveId(t.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className={cn(!activeThread && 'hidden lg:block')}>
          {activeThread ? (
            <Conversation
              key={activeThread.id}
              thread={activeThread}
              onBack={() => setActiveId(null)}
              onChanged={afterThreadUpdate}
            />
          ) : (
            <div className="hidden lg:flex h-[70vh] flex-col items-center justify-center rounded-3xl border border-dashed border-[#DDE5DE] bg-card/50 text-center">
              <HandCoins size={40} className="text-[#FBC02D]" />
              <h2 className="mt-4 font-display text-2xl font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">Pick a conversation</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Select an offer on the left to chat, counter-offer, and close the deal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ThreadListItem({
  thread,
  role,
  active,
  onClick,
}: {
  thread: ApiThread
  role: 'buyer' | 'seller'
  active: boolean
  onClick: () => void
}) {
  const other = role === 'buyer' ? thread.seller : thread.buyer
  const last = thread.messages[thread.messages.length - 1]
  const thumb = thread.listing.images[0]?.url
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all outline-none',
        active
          ? 'border-[#2E7D32] bg-background/80 shadow-md dark:bg-[#1B3D24]/80'
          : 'border-border bg-card hover:border-[#FBC02D] hover:shadow-sm'
      )}
    >
      <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {thumb && <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{other.name}</span>
          <StatusBadge status={thread.status} />
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{thread.listing.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
          {last ? (last.kind === 'OFFER' ? `Offer: ${formatGHS(last.price ?? 0)} × ${last.quantity}` : last.kind === 'SYSTEM' ? last.body : last.body) : 'No messages yet'}
        </span>
      </span>
      <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(thread.updatedAt)}</span>
    </button>
  )
}

function Conversation({
  thread: initialThread,
  onBack,
  onChanged,
}: {
  thread: ApiThread
  onBack: () => void
  onChanged: (updated?: ApiThread) => void
}) {
  const { user, refreshUnreadCounts, t } = useApp()
  const [thread, setThread] = useState<ApiThread>(initialThread)
  const [messages, setMessages] = useState<ApiOfferMessage[]>(initialThread.messages)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const reload = useCallback(async () => {
    try {
      const data = await api<{ thread: ApiThread }>(`/api/threads/${thread.id}`)
      setThread(data.thread)
      setMessages(data.thread.messages)
      onChanged(data.thread)
    } catch {
      /* ignore */
    }
  }, [thread.id, onChanged])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const isBuyer = user?.id === thread.buyer.id
  const isSeller = user?.id === thread.seller.id
  const other = isBuyer ? thread.seller : thread.buyer
  const negotiable = thread.status === 'OPEN' || thread.status === 'NEGOTIATING'
  const contactVisible = thread.status === 'AGREED' || thread.status === 'COMPLETED'
  const latestOffer = [...messages].reverse().find((m) => m.kind === 'OFFER')

  const sendText = async () => {
    const t = text.trim()
    if (!t) return
    setBusy(true)
    try {
      await api(`/api/threads/${thread.id}/messages`, { method: 'POST', json: { body: t } })
      setText('')
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send.')
    } finally {
      setBusy(false)
    }
  }

  const act = async (action: string) => {
    setBusy(true)
    try {
      const data = await api<{ thread?: ApiThread }>(`/api/threads/${thread.id}/messages`, {
        method: 'POST',
        json: { action },
      })
      // The action response already carries the updated thread (status,
      // updatedAt). Apply it to local state and the list immediately so the
      // status badge, contacts banner and action buttons update right away —
      // the reload() below only enriches with the system message + contacts.
      const updated = data.thread
      if (updated) {
        setThread((prev) => ({ ...prev, ...updated }))
        onChanged(updated)
      }
      if (action === 'ACCEPT') toast.success('Deal agreed! 🤝 Contacts are now shared below.')
      if (action === 'COMPLETE') toast.success('Deal marked as completed. Medaase!')
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background/40 p-4">
        <button
          onClick={onBack}
          className="lg:hidden rounded-full p-2 hover:bg-[#FBC02D]/30 text-[#124116] dark:text-[#6FBF73]"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {thread.listing.images[0] && (
            <Image src={thread.listing.images[0].url} alt="" fill sizes="56px" className="object-cover" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{thread.listing.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            Asking {formatGHS(thread.listing.price)} / {thread.listing.unit} · with <strong>{other.name}</strong>
          </p>
        </div>
        <StatusBadge status={thread.status} />
      </div>

      {/* Contact banner when agreed */}
      {contactVisible && (
        <div className="flex flex-wrap items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-800/50 dark:bg-emerald-950/40">
          <ShieldCheck size={17} className="text-emerald-700 dark:text-emerald-300" />
          <span className="font-medium text-emerald-900 dark:text-emerald-100">{t('contacts_unlocked')}</span>
          {thread.seller.phone ? (
            <a href={`tel:${thread.seller.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-200 dark:ring-emerald-800 dark:hover:bg-emerald-900">
              <Phone size={13} /> {t('seller')}: {thread.seller.phone}
            </a>
          ) : (
            <span className="text-xs text-emerald-700/70 dark:text-emerald-300/70">(seller has no phone on file)</span>
          )}
          {thread.buyer.phone ? (
            <a href={`tel:${thread.buyer.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-200 dark:ring-emerald-800 dark:hover:bg-emerald-900">
              <Phone size={13} /> {t('buyer')}: {thread.buyer.phone}
            </a>
          ) : (
            <span className="text-xs text-emerald-700/70 dark:text-emerald-300/70">(buyer has no phone on file)</span>
          )}
          {(() => {
            const agreed = latestOffer
            const amount = agreed?.price ?? thread.listing.price
            const qty = agreed?.quantity
            const msg =
              `Hello ${other.name}, I am ${user?.name ?? ''} from AkuafoDwa. ` +
              `We agreed on ${thread.listing.title}` +
              (qty ? ` (${qty} ${thread.listing.unit} at GH\u20b5${amount} per ${thread.listing.unit})` : ` at GH\u20b5${amount} per ${thread.listing.unit}`) +
              `. I would like to arrange payment and delivery. Medaase!`
            const href = whatsappLink(other.phone, msg)
            if (!href) return null
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 font-semibold text-white shadow-sm hover:brightness-95"
                aria-label={`Chat with ${other.name} on WhatsApp`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.25 8.23m4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.73-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29" />
                </svg>
                {t('chat_whatsapp')}
              </a>
            )
          })()}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="nice-scroll flex-1 space-y-3 overflow-y-auto p-4 md:max-h-[46vh]">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} mine={Boolean(m.senderId && m.senderId === user?.id)} />
        ))}
      </div>

      {/* Action bar */}
      <div className="border-t border-border bg-background/30 p-3">
        {negotiable && isSeller && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => act('ACCEPT')}
              disabled={busy || !latestOffer}
              className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
            >
              🤝 {t('accept_offer')} {latestOffer ? `(${formatGHS(latestOffer.price ?? 0)} × ${latestOffer.quantity} ${thread.listing.unit})` : ''}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOfferOpen(true)}
              className="rounded-full border-[#2E7D32] text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20"
            >
              <HandCoins size={14} className="mr-1" /> {t('counter_offer')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => act('DECLINE')}
              disabled={busy}
              className="rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {t('decline')}
            </Button>
          </div>
        )}
        {negotiable && isBuyer && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setOfferOpen(true)}
              className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
            >
              <HandCoins size={14} className="mr-1" /> {t('send_offer')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => act('CANCEL')}
              disabled={busy}
              className="rounded-full border-[#FBC02D] text-muted-foreground hover:bg-[#FBC02D]/20"
            >
              {t('cancel_deal')}
            </Button>
          </div>
        )}
        {thread.status === 'AGREED' && (
          <div className="mb-3">
            <Button size="sm" onClick={() => act('COMPLETE')} disabled={busy} className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
              ✅ {t('mark_completed')}
            </Button>
          </div>
        )}
        {thread.status === 'COMPLETED' && isBuyer && !thread.review && (
          <div className="mb-3">
            <Button size="sm" onClick={() => setReviewOpen(true)} className="rounded-full bg-[#C99B45] text-white hover:bg-[#b3893d]">
              <Star size={14} className="mr-1 fill-current" /> {t('leave_review')}
            </Button>
          </div>
        )}
        {thread.status === 'COMPLETED' && thread.review && (
          <div className="mb-3 rounded-xl bg-muted px-3.5 py-2.5 text-sm flex items-center gap-2">
            <Stars value={thread.review.rating} />
            <span className="text-muted-foreground">
              You rated this deal {thread.review.rating}/5{thread.review.comment ? `: “${thread.review.comment}”` : ''}
            </span>
          </div>
        )}

        {!['DECLINED', 'CANCELLED', 'COMPLETED'].includes(thread.status) ? (
          <div className="flex gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendText()
                }
              }}
              placeholder={t('type_message')}
              rows={1}
              className="min-h-11 flex-1 resize-none rounded-2xl bg-background py-3"
              aria-label="Message"
            />
            <Button
              onClick={sendText}
              disabled={busy || !text.trim()}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
              aria-label="Send message"
            >
              <Send size={17} />
            </Button>
          </div>
        ) : (
          <p className="rounded-xl bg-muted px-3.5 py-2.5 text-center text-xs text-muted-foreground">
            This conversation has ended. The listing is{' '}
            {thread.status === 'COMPLETED' ? 'successfully completed' : thread.status === 'DECLINED' ? 'declined' : 'cancelled'}.
          </p>
        )}
      </div>

      {/* Counter offer dialog */}
      <CounterOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        thread={thread}
        onSent={async () => {
          setOfferOpen(false)
          await reload()
          refreshUnreadCounts()
        }}
      />

      {/* Review dialog */}
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        threadId={thread.id}
        sellerName={thread.seller.name}
        onDone={reload}
      />
    </div>
  )
}

function MessageBubble({ message: m, mine }: { message: ApiOfferMessage; mine: boolean }) {
  const { t } = useApp()
  if (m.kind === 'SYSTEM') {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-muted px-4 py-1.5 text-center text-xs text-[#124116] dark:text-[#A3C4A8]">
          {m.body}
        </span>
      </div>
    )
  }
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
          mine
            ? 'rounded-br-md bg-[#1B5E20] text-[#FFFDF5]'
            : 'rounded-bl-md bg-[#E8F5E9] text-[#1F2937] dark:bg-[#1B3D24] dark:text-[#EDF7EE]'
        )}
      >
        {m.kind === 'OFFER' ? (
          <div className={cn('mb-1.5 rounded-xl px-3 py-2', mine ? 'bg-white/10' : 'bg-white/70 dark:bg-white/10')}>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <HandCoins size={13} /> {mine ? t('your_offer') : 'Offer'}
            </p>
            <p className="mt-1 font-display text-lg font-bold">
              {formatGHS(m.price ?? 0)}{' '}
              <span className="text-xs font-normal">/ unit × {m.quantity} units</span>
            </p>
            {m.body && <p className={cn('mt-1 text-xs', mine ? 'text-[#E8F5E9]/85' : 'text-muted-foreground')}>{m.body}</p>}
          </div>
        ) : null}
        {m.body && m.kind !== 'OFFER' && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        <p className={cn('mt-1 text-right text-[10px]', mine ? 'text-[#E8F5E9]/60' : 'text-muted-foreground/70')}>
          {timeAgo(m.createdAt)}
        </p>
      </div>
    </div>
  )
}

function CounterOfferDialog({
  open,
  onOpenChange,
  thread,
  onSent,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  thread: ApiThread
  onSent: () => void
}) {
  const { t } = useApp()
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setQuantity('')
      setPrice('')
      setMessage('')
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    try {
      await api(`/api/threads/${thread.id}/messages`, {
        method: 'POST',
        json: { kind: 'OFFER', quantity: parseFloat(quantity), price: parseFloat(price), message: message || undefined },
      })
      toast.success('Counter offer sent.')
      onSent()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send offer.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-[#1B5E20] dark:text-[#EDF7EE]">
            {thread.status === 'OPEN' ? t('send_offer') : t('counter_offer')}
          </DialogTitle>
          <DialogDescription>
            Propose quantity and price for “{thread.listing.title}”.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="co-qty">Quantity ({thread.listing.unit})</Label>
            <Input id="co-qty" type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1.5 bg-background" />
          </div>
          <div>
            <Label htmlFor="co-price">Price (GH₵ / {thread.listing.unit})</Label>
            <Input id="co-price" type="number" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(thread.listing.price)} className="mt-1.5 bg-background" />
          </div>
        </div>
        <div>
          <Label htmlFor="co-msg">Note (optional)</Label>
          <Textarea id="co-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5 resize-none bg-background" />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !parseFloat(quantity) || !parseFloat(price)} className="w-full rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] font-semibold text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
            {busy ? 'Sending…' : t('send_offer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  threadId,
  sellerName,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  threadId: string
  sellerName: string
  onDone: () => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!rating) return
    setBusy(true)
    try {
      await api('/api/reviews', { method: 'POST', json: { threadId, rating, comment: comment || undefined } })
      toast.success('Medaase! Your rating helps other buyers. ⭐')
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit rating.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-[#1B5E20] dark:text-[#EDF7EE]">Rate {sellerName}</DialogTitle>
          <DialogDescription>How was the produce and the dealing?</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => setRating(i)}
              className="rounded-full p-1.5 transition-transform hover:scale-125 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
            >
              <Star size={30} className={cn(i <= rating ? 'fill-[#C99B45] text-[#C99B45]' : 'text-[#C99B45]/40')} />
            </button>
          ))}
        </div>
        <Textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional: share your experience…"
          className="resize-none bg-background"
        />
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !rating} className="w-full rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] font-semibold text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
            {busy ? 'Submitting…' : 'Submit rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

