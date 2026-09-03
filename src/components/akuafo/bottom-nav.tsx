'use client'

import React from 'react'
import { Store, Heart, Plus, MessageSquareText, UserRound } from 'lucide-react'
import { useApp } from './store'
import { cn } from '@/lib/utils'

/*
 * App-style bottom navigation bar (Instagram/TikTok pattern) — mobile only.
 * Home · Saved · POST (elevated gold button) · Offers · Account.
 * Hidden on desktop, where the header already carries navigation, and on the
 * inbox chat thread, whose composer owns the bottom edge.
 */
export function BottomNav() {
  const { user, route, navigate, openAuth, unreadCounts, t } = useApp()

  // The chat thread view has its own bottom composer — don't stack on it.
  if (route.name === 'inbox' && route.id) return null

  const badge = unreadCounts.selling + unreadCounts.buying
  const isBrowse = route.name === 'browse' || route.name === 'listing'

  const itemClass = (active: boolean) =>
    cn(
      'relative flex min-w-0 flex-1 flex-col items-center justify-start gap-0.5 rounded-xl px-1 pb-1 pt-1.5 text-[10px] font-medium leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#FBC02D]',
      active
        ? 'text-[#1B5E20] dark:text-[#6FBF73] font-semibold'
        : 'text-muted-foreground hover:text-foreground'
    )

  const go = (href: string) => navigate(href)

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-start justify-around px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5">
        {/* Home */}
        <button onClick={() => go('/')} className={itemClass(isBrowse)} aria-current={isBrowse ? 'page' : undefined}>
          <Store size={21} strokeWidth={isBrowse ? 2.4 : 2} />
          <span className="w-full truncate text-center">{t('browse')}</span>
        </button>

        {/* Saved */}
        <button
          onClick={() => go('/favorites')}
          className={itemClass(route.name === 'favorites')}
          aria-current={route.name === 'favorites' ? 'page' : undefined}
        >
          <Heart size={21} strokeWidth={route.name === 'favorites' ? 2.4 : 2} className={cn(route.name === 'favorites' && 'fill-current')} />
          <span className="w-full truncate text-center">{t('saved')}</span>
        </button>

        {/* Post — elevated centre button, the Instagram/TikTok “+” pattern */}
        <button
          onClick={() => go('/sell')}
          className="group relative -mt-5 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-[#FBC02D] text-[#1F2937] shadow-lg shadow-[#FBC02D]/30 ring-4 ring-background transition-transform hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#FBC02D] focus-visible:ring-offset-2"
          aria-label={t('sell_produce')}
        >
          <Plus size={26} strokeWidth={2.75} />
        </button>
        <span className="pointer-events-none sr-only">{t('sell_produce')}</span>

        {/* Offers */}
        <button
          onClick={() => go('/inbox')}
          className={itemClass(route.name === 'inbox')}
          aria-current={route.name === 'inbox' ? 'page' : undefined}
        >
          <span className="relative">
            <MessageSquareText size={21} strokeWidth={route.name === 'inbox' ? 2.4 : 2} />
            {badge > 0 && (
              <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FBC02D] px-1 text-[10px] font-bold text-[#1F2937]">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span className="w-full truncate text-center">{t('offers')}</span>
        </button>

        {/* Account — sign-in dialog for guests, profile for members */}
        <button
          onClick={() => (user ? go('/profile') : openAuth('login'))}
          className={itemClass(route.name === 'profile')}
          aria-current={route.name === 'profile' ? 'page' : undefined}
        >
          <UserRound size={21} strokeWidth={route.name === 'profile' ? 2.4 : 2} />
          <span className="w-full truncate text-center">{user ? t('my_profile') : t('sign_in')}</span>
        </button>
      </div>
    </nav>
  )
}
