'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { api, storeSessionToken } from '@/lib/api'
import type { ApiCategory, ApiUser } from '@/lib/types'
import { translate, type Lang, type StringKey } from '@/lib/i18n'

export interface Route {
  name:
    | 'browse'
    | 'listing'
    | 'sell'
    | 'my-listings'
    | 'inbox'
    | 'favorites'
    | 'profile'
    | 'admin'
  id?: string
  query?: Record<string, string>
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  const [pathPart, queryPart] = clean.split('?')
  const query: Record<string, string> = {}
  if (queryPart) {
    for (const [k, v] of new URLSearchParams(queryPart)) query[k] = v
  }
  const parts = pathPart.split('/').filter(Boolean)
  const known = [
    'listing',
    'sell',
    'my-listings',
    'inbox',
    'favorites',
    'profile',
    'admin',
  ]
  if (parts.length === 0) return { name: 'browse', query }
  const head = parts[0]
  if (head === 'listing' && parts[1]) return { name: 'listing', id: parts[1], query }
  if (head === 'inbox' && parts[1]) return { name: 'inbox', id: parts[1], query }
  if (known.includes(head)) return { name: head as Route['name'], query }
  return { name: 'browse', query }
}

interface AppContextValue {
  user: ApiUser | null
  userLoading: boolean
  categories: ApiCategory[]
  route: Route
  authOpen: boolean
  authMode: 'login' | 'register'
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  setAuthMode: (m: 'login' | 'register') => void
  refreshUser: () => Promise<void>
  applyUser: (u: ApiUser | null) => void
  logout: () => Promise<void>
  refreshCategories: () => Promise<void>
  navigate: (to: string) => void
  requireAuth: (thenNavigate?: string, onAuthed?: () => void) => boolean
  runPendingAction: () => boolean
  unreadCounts: { selling: number; buying: number; agreements: number }
  refreshUnreadCounts: () => Promise<void>
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey) => string
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [route, setRoute] = useState<Route>({ name: 'browse' })
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [unreadCounts, setUnreadCounts] = useState({ selling: 0, buying: 0, agreements: 0 })
  const [lang, setLangState] = useState<Lang>('en')

  // Restore the saved language choice before first paint of user content.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('akuafo_lang')
      if (saved === 'tw' || saved === 'en') setLangState(saved)
    } catch {
      /* default English */
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      window.localStorage.setItem('akuafo_lang', l)
    } catch {
      /* in-memory only */
    }
  }, [])

  // Keep the document language attribute in sync for screen readers and search engines.
  useEffect(() => {
    document.documentElement.lang = lang === 'tw' ? 'tw' : 'en'
  }, [lang])

  const t = useCallback((key: StringKey) => translate(lang, key), [lang])

  const refreshUser = useCallback(async () => {
    try {
      const data = await api<{ user: ApiUser | null }>('/api/auth/me')
      setUser(data.user)
    } catch {
      // Network or server hiccup: keep the current session instead of
      // logging the user out. A true signed-out state arrives as user: null.
    } finally {
      setUserLoading(false)
    }
  }, [])

  // Apply the user returned directly by login/register so the session works
  // immediately, even in environments where the token cannot be persisted.
  const applyUser = useCallback((u: ApiUser | null) => {
    setUser(u)
    setUserLoading(false)
  }, [])

  const refreshCategories = useCallback(async () => {
    try {
      const data = await api<{ categories: ApiCategory[] }>('/api/categories')
      setCategories(data.categories)
    } catch {
      /* ignore */
    }
  }, [])

  const refreshUnreadCounts = useCallback(async () => {
    try {
      const data = await api<{ selling: number; buying: number; agreements: number }>(
        '/api/threads?meta=1'
      )
      setUnreadCounts(data)
    } catch {
      setUnreadCounts({ selling: 0, buying: 0, agreements: 0 })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    storeSessionToken(null)
    setUser(null)
    setUnreadCounts({ selling: 0, buying: 0, agreements: 0 })
  }, [])

  const navigate = useCallback((to: string) => {
    window.location.hash = to.startsWith('#') ? to : `#${to}`
  }, [])

  const openAuth = useCallback(
    (mode: 'login' | 'register' = 'login') => {
      setAuthMode(mode)
      setAuthOpen(true)
    },
    []
  )

  // Action to resume once the user completes sign-in (e.g. re-opening the
  // offer dialog they were blocked from). Cleared when the dialog is dismissed.
  const pendingActionRef = useRef<(() => void) | null>(null)

  const requireAuth = useCallback(
    (thenNavigate?: string, onAuthed?: () => void) => {
      if (user) return true
      pendingActionRef.current = onAuthed ?? (thenNavigate ? () => navigate(thenNavigate) : null)
      openAuth('login')
      return false
    },
    [user, openAuth, navigate]
  )

  const runPendingAction = useCallback((): boolean => {
    const action = pendingActionRef.current
    pendingActionRef.current = null
    if (!action) return false
    action()
    return true
  }, [])

  // Hash routing
  useEffect(() => {
    // Shared links arrive as /?listing=<id> (crawlable, so WhatsApp can build
    // a rich preview card). Land the visitor on the listing itself while
    // keeping the query string so a re-share still unfurls the card.
    try {
      const sharedId = new URLSearchParams(window.location.search).get('listing')
      if (sharedId && !window.location.hash.startsWith(`#/listing/${sharedId}`)) {
        window.history.replaceState(null, '', `/?listing=${encodeURIComponent(sharedId)}#/listing/${sharedId}`)
      }
    } catch {
      /* share param is a progressive enhancement */
    }
    const onHash = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Initial loads
  useEffect(() => {
    refreshUser()
    refreshCategories()
  }, [refreshUser, refreshCategories])

  // Poll thread counts while signed in
  useEffect(() => {
    if (!user) return
    refreshUnreadCounts()
    const t = setInterval(refreshUnreadCounts, 30000)
    return () => clearInterval(t)
  }, [user, refreshUnreadCounts])

  const value = useMemo(
    () => ({
      user,
      userLoading,
      categories,
      route,
      authOpen,
      authMode,
      openAuth,
      closeAuth: () => {
        pendingActionRef.current = null
        setAuthOpen(false)
      },
      setAuthMode,
      refreshUser,
      applyUser,
      logout,
      refreshCategories,
      navigate,
      requireAuth,
      runPendingAction,
      unreadCounts,
      refreshUnreadCounts,
      lang,
      setLang,
      t,
    }),
    [
      user,
      userLoading,
      categories,
      route,
      authOpen,
      authMode,
      openAuth,
      refreshUser,
      applyUser,
      logout,
      refreshCategories,
      navigate,
      requireAuth,
      runPendingAction,
      unreadCounts,
      refreshUnreadCounts,
      lang,
      setLang,
      t,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
