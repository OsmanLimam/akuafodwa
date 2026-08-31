// Client-safe session constants only: lib/auth.ts is server-only
// (next/headers, crypto, Prisma) and must never enter the client bundle.
import { SESSION_HEADER, SESSION_STORAGE_KEY } from '@/lib/session'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Session token transports, in order of reliability:
// 1. httpOnly cookie (primary, survives reloads when cookies are allowed)
// 2. localStorage mirror, sent via X-Session-Token (survives reloads when
//    storage is allowed but cookies are blocked, e.g. cross-site iframes)
// 3. module memory (always works for the current SPA session, even in
//    sandboxed iframes that block BOTH cookies and localStorage)
let memoryToken: string | null = null

export function getStoredSessionToken(): string | null {
  if (memoryToken) return memoryToken
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) memoryToken = stored
    return stored
  } catch {
    return null
  }
}

export function storeSessionToken(token: string | null) {
  memoryToken = token
  if (typeof window === 'undefined') return
  try {
    if (token) window.localStorage.setItem(SESSION_STORAGE_KEY, token)
    else window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    /* storage unavailable; the in-memory token still authenticates this SPA session */
  }
}

export async function api<T>(
  path: string,
  options?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = options ?? {}
  const token = getStoredSessionToken()
  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { [SESSION_HEADER]: token } : {}),
      ...(rest.headers ?? {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
  })
  let data: unknown = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: unknown }).error)
        : 'Something went wrong. Please try again.'
    throw new ApiError(msg, res.status)
  }
  return data as T
}
