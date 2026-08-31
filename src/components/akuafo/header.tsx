'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import {
  Store,
  HandCoins,
  PackageSearch,
  MessageSquareText,
  Heart,
  ShieldCheck,
  Menu,
  LogOut,
  UserRound,
  Moon,
  Sun,
  Languages,
} from 'lucide-react'
import { useApp } from './store'
import { AvatarInitials } from './misc'
import { InstallAppButton } from './pwa'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function Wordmark() {
  const { navigate } = useApp()
  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center gap-2.5 group outline-none"
      aria-label="AkuafoDwa home"
    >
      <span className="relative h-10 w-10 rounded-xl overflow-hidden ring-2 ring-[#FBC02D]/40 group-hover:ring-[#FBC02D] transition-all shadow-lg">
        <Image src="/logo.png" alt="AkuafoDwa logo, market basket with sprout" fill sizes="40px" className="object-cover" />
      </span>
      <span className="font-display text-[1.15rem] leading-none font-bold tracking-tight text-[#FFFDF5] sm:text-[1.4rem]">
        Akuafo<span className="italic text-[#FBC02D]">Dwa</span>
      </span>
    </button>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  badge?: number
  onClick?: () => void
}

function NavLink({ href, icon, label, active, badge, onClick }: NavLinkProps) {
  const { navigate } = useApp()
  return (
    <button
      onClick={() => {
        navigate(href)
        onClick?.()
      }}
      className={cn(
        'relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-full text-sm font-medium transition-colors outline-none',
        active
          ? 'bg-[#FFFDF5] text-[#1B5E20]'
          : 'text-[#E8F5E9]/85 hover:text-white hover:bg-white/10'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FBC02D] px-1 text-[11px] font-bold text-[#1F2937]">
          {badge}
        </span>
      )}
    </button>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#FFFDF5] hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[#FBC02D]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {mounted ? (isDark ? <Sun size={17} /> : <Moon size={17} />) : <Moon size={17} />}
    </button>
  )
}

function LangSwitch({ stacked = false }: { stacked?: boolean }) {
  const { lang, setLang } = useApp()
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-[#FBC02D]/40 p-0.5',
        stacked ? 'self-start' : ''
      )}
      role="group"
      aria-label="Language"
    >
      <Languages size={14} className="mx-1.5 hidden text-[#FBC02D]/80 sm:inline" aria-hidden="true" />
      {(['en', 'tw'] as const).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#FBC02D]',
            lang === code ? 'bg-[#FFFDF5] text-[#1B5E20]' : 'text-[#E8F5E9]/75 hover:text-white'
          )}
        >
          {code === 'en' ? 'EN' : 'TW'}
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const { user, route, navigate, openAuth, logout, unreadCounts, t, lang } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  const active = route.name
  const isBrowse = active === 'browse' || active === 'listing'

  // The owner's Twi labels are much longer than the English ones, so Twi only
  // fits the desktop bar from 2xl up; English keeps the xl breakpoint.
  const navShow = lang === 'tw' ? 'hidden 2xl:flex' : 'hidden xl:flex'
  const navHide = lang === 'tw' ? '2xl:hidden' : 'xl:hidden'

  const navItems = (
    <>
      <NavLink href="/" icon={<Store size={16} />} label={t('browse')} active={isBrowse} />
      <NavLink href="/my-listings" icon={<PackageSearch size={16} />} label={t('my_listings')} active={active === 'my-listings'} />
      <NavLink
        href="/inbox"
        icon={<MessageSquareText size={16} />}
        label={t('offers')}
        active={active === 'inbox'}
        badge={unreadCounts.selling + unreadCounts.buying}
      />
      <NavLink href="/favorites" icon={<Heart size={16} />} label={t('saved')} active={active === 'favorites'} />
    </>
  )

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0C2410] via-[#1B5E20] to-[#2E7D32] shadow-md">
      <div className="h-1 kente-stripes opacity-80" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <Wordmark />

          {/* Desktop nav (English from xl, Twi from 2xl; below that the
              drawer carries navigation, because the Twi labels are long) */}
          <nav className={cn(navShow, 'items-center gap-1')} aria-label="Main">
            {user && navItems}
          </nav>

          <div className="flex items-center gap-2">
            <LangSwitch />
            <ThemeToggle />
            <InstallAppButton
              className="hidden xl:inline-flex bg-transparent border-[#FBC02D]/60 text-[#FFFDF5] hover:bg-white/10 hover:text-white rounded-full h-9 px-4"
              label={t('install_app')}
            />
            <Button
              onClick={() => navigate('/sell')}
              className="hidden sm:inline-flex bg-[#FBC02D] text-[#1F2937] hover:bg-[#FFFDF5] font-semibold rounded-full h-9 px-4 shadow-sm"
            >
              <HandCoins size={16} className="mr-1.5" />
              {t('sell_produce')}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none rounded-full ring-offset-2 ring-offset-[#1B5E20] focus-visible:ring-2 focus-visible:ring-[#FBC02D]" aria-label="Account menu">
                    <AvatarInitials name={user.name} className="ring-2 ring-[#FBC02D]/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal truncate">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserRound size={15} className="mr-2" /> {t('my_profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                    <PackageSearch size={15} className="mr-2" /> {t('my_listings')}
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <ShieldCheck size={15} className="mr-2" /> Admin dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout()
                      toast('You have been signed out. Medaase!')
                      navigate('/')
                    }}
                  >
                    <LogOut size={15} className="mr-2" /> {t('sign_out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => openAuth('login')}
                variant="outline"
                className="hidden sm:inline-flex bg-transparent border-[#FBC02D]/60 text-[#FFFDF5] hover:bg-white/10 hover:text-white rounded-full h-9 px-4"
              >
                {t('sign_in')}
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(navHide, 'inline-flex h-10 w-10 items-center justify-center rounded-full text-[#FFFDF5] hover:bg-white/10 outline-none')}
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#1B5E20] border-l-[#124116] text-[#FFFDF5] w-72 p-0">
                <SheetHeader className="p-4 pb-2">
                  <SheetTitle className="text-left">
                    <span className="font-display text-xl font-bold text-[#FFFDF5]">
                      Akuafo<span className="italic text-[#FBC02D]">Dwa</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 px-3 pb-6">
                  <div className="flex items-center justify-between gap-2 px-1 py-2">
                    <LangSwitch stacked />
                    <ThemeToggle />
                  </div>
                  {user ? (
                    <>
                      <MobileLink href="/" label={t('browse')} icon={<Store size={17} />} onGo={() => setMobileOpen(false)} active={isBrowse} />
                      <MobileLink href="/sell" label={t('sell_produce')} icon={<HandCoins size={17} />} onGo={() => setMobileOpen(false)} active={active === 'sell'} />
                      <MobileLink href="/my-listings" label={t('my_listings')} icon={<PackageSearch size={17} />} onGo={() => setMobileOpen(false)} active={active === 'my-listings'} />
                      <MobileLink href="/inbox" label={t('offers')} icon={<MessageSquareText size={17} />} onGo={() => setMobileOpen(false)} active={active === 'inbox'} badge={unreadCounts.selling + unreadCounts.buying} />
                      <MobileLink href="/favorites" label={t('saved')} icon={<Heart size={17} />} onGo={() => setMobileOpen(false)} active={active === 'favorites'} />
                      <MobileLink href="/profile" label={t('my_profile')} icon={<UserRound size={17} />} onGo={() => setMobileOpen(false)} active={active === 'profile'} />
                      {user.role === 'ADMIN' && (
                        <MobileLink href="/admin" label="Admin dashboard" icon={<ShieldCheck size={17} />} onGo={() => setMobileOpen(false)} active={active === 'admin'} />
                      )}
                      <div className="mt-3 border-t border-white/15 pt-3">
                        <InstallAppButton
                          className="w-full justify-start mb-2 bg-transparent border-[#FBC02D]/60 text-[#FFFDF5] hover:bg-white/10 hover:text-white rounded-xl font-semibold"
                          label={t('install_app')}
                        />
                        <button
                          onClick={async () => {
                            await logout()
                            setMobileOpen(false)
                            toast('You have been signed out. Medaase!')
                            navigate('/')
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#E8F5E9]/85 hover:bg-white/10"
                        >
                          <LogOut size={17} /> {t('sign_out')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="px-1 pt-2 flex flex-col gap-2">
                      <Button onClick={() => { setMobileOpen(false); openAuth('login') }} className="bg-[#FFFDF5] text-[#1B5E20] hover:bg-white rounded-full font-semibold">
                        {t('sign_in')}
                      </Button>
                      <Button onClick={() => { setMobileOpen(false); openAuth('register') }} variant="outline" className="bg-transparent border-[#FBC02D]/60 text-[#FFFDF5] hover:bg-white/10 hover:text-white rounded-full font-semibold">
                        {t('create_account')}
                      </Button>
                      {/* First-time visitors are exactly who should install the app. */}
                      <InstallAppButton
                        className="w-full justify-start bg-transparent border-[#FBC02D]/60 text-[#FFFDF5] hover:bg-white/10 hover:text-white rounded-xl font-semibold"
                        label={t('install_app')}
                      />
                      <p className="text-xs text-[#E8F5E9]/60 px-1 pt-2">
                        Buy, sell and negotiate farm produce. Free to join.
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileLink({
  href,
  label,
  icon,
  active,
  badge,
  onGo,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
  badge?: number
  onGo: () => void
}) {
  const { navigate } = useApp()
  return (
    <button
      onClick={() => {
        navigate(href)
        onGo()
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
        active ? 'bg-[#FFFDF5] text-[#1B5E20] font-semibold' : 'text-[#E8F5E9]/90 hover:bg-white/10'
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FBC02D] px-1 text-[11px] font-bold text-[#1F2937]">
          {badge}
        </span>
      )}
    </button>
  )
}
