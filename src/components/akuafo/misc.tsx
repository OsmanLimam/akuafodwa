'use client'

import React from 'react'
import { Star, Inbox, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useApp } from './store'
import type { StringKey } from '@/lib/i18n'

export function Stars({
  value,
  size = 14,
  className,
}: {
  value: number | null | undefined
  size?: number
  className?: string
}) {
  const v = value ?? 0
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Rated ${v.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= Math.round(v) ? 'fill-[#C99B45] text-[#C99B45]' : 'fill-transparent text-[#C99B45]/40'
          )}
        />
      ))}
    </span>
  )
}

export function AvatarInitials({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#124116] to-[#2E7D32] font-display font-semibold text-[#FFFDF5] select-none shrink-0',
        'h-10 w-10 text-sm',
        className
      )}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: 'inbox' | 'heart' | 'search' | 'leaf'
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  const Icon = icon === 'heart' ? Heart : icon === 'search' ? Inbox : icon === 'leaf' ? Inbox : Inbox
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-3xl border border-dashed border-[#DDE5DE] bg-card/60">
      <span className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-[#2E7D32] dark:text-[#6FBF73]">
        <Icon size={28} strokeWidth={1.6} />
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold text-primary">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useApp()
  // Only the deal states the owner transcribed get translated; the rest stay English.
  const translated: Record<string, { cls: string; label?: StringKey }> = {
    NEGOTIATING: { cls: 'bg-[#2E7D32]/15 text-[#2E7D32] dark:bg-[#2E7D32]/30 dark:text-[#8FD694]', label: 'negotiating' },
    AGREED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'deal_agreed' },
    COMPLETED: { cls: 'bg-[#1B5E20] text-[#FFFDF5]', label: 'completed' },
  }
  const styles: Record<string, { cls: string; label: string }> = {
    ACTIVE: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Active' },
    SOLD: { cls: 'bg-[#1B5E20] text-[#FFFDF5]', label: 'Sold' },
    TAKEN_DOWN: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'Taken down' },
    OPEN: { cls: 'bg-[#FBC02D]/50 text-[#124116] dark:text-[#D7EED9]', label: 'New offer' },
    DECLINED: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'Declined' },
    CANCELLED: { cls: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300', label: 'Cancelled' },
  }
  if (translated[status]?.label) {
    const s = translated[status]
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', s.cls)}>
        {t(s.label!)}
      </span>
    )
  }
  const s = styles[status] ?? { cls: 'bg-muted text-muted-foreground', label: status }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', s.cls)}>
      {s.label}
    </span>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-5 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function DemoHint({ onFill }: { onFill: (email: string, pass: string) => void }) {
  const { t } = useApp()
  const accounts = [
    { label: t('farmer'), email: 'akua@akuafodwa.com', pass: 'demo1234' },
    { label: t('buyer'), email: 'kwame@akuafodwa.com', pass: 'demo1234' },
    { label: 'Admin', email: 'admin@akuafodwa.com', pass: 'admin1234' },
  ]
  return (
    <div className="rounded-xl border border-dashed border-[#FBC02D] bg-background/60 p-3 text-xs text-muted-foreground space-y-2">
      <p className="font-medium text-foreground/70">Demo accounts, one tap to fill:</p>
      <div className="flex flex-wrap gap-2">
        {accounts.map((a) => (
          <Button
            key={a.email}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs border-[#FBC02D] hover:bg-[#FBC02D]/30"
            onClick={() => onFill(a.email, a.pass)}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
