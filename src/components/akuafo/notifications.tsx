'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, BellOff, Loader2, Send } from 'lucide-react'

type PushState = 'loading' | 'unsupported' | 'denied' | 'off' | 'on'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Web push notifications, opt-in per device.
 * The subscription lives in this browser (service worker push scope) and is
 * stored server-side so offer/deal events can wake the device later.
 */
export function NotificationsSection() {
  const [state, setState] = useState<PushState>('loading')
  const [devices, setDevices] = useState(0)
  const [busy, setBusy] = useState(false)

  const sync = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (Notification.permission === 'granted' && sub) {
        setState('on')
        const res = await api<{ devices: number }>('/api/push').catch(() => null)
        setDevices(res?.devices ?? 1)
      } else {
        setState('off')
      }
    } catch {
      setState('off')
    }
  }, [])

  useEffect(() => {
    void sync()
  }, [sync])

  const enable = async () => {
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setState('denied')
        toast('Notifications are blocked in the browser settings.', {
          description: 'Allow notifications for this site to get offer alerts.',
        })
        return
      }
      const reg = await navigator.serviceWorker.ready
      const { publicKey } = await api<{ publicKey: string | null }>('/api/push')
      if (!publicKey) {
        toast.error('Push is not configured on the server yet.')
        return
      }
      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        }))
      await api('/api/push', { method: 'POST', json: { subscription: sub.toJSON() } })
      setState('on')
      setDevices((d) => Math.max(1, d))
      toast.success('Notifications on! 🔔 Offers and deal updates will reach you here.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not turn on notifications.')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await api('/api/push', { method: 'DELETE', json: { endpoint } }).catch(() => undefined)
      }
      setState('off')
      setDevices(0)
      toast('Notifications turned off for this device.')
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true)
    try {
      await api('/api/push/test', { method: 'POST' })
      toast('Test sent — watch for the notification. 🔔')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed.')
    } finally {
      setBusy(false)
    }
  }

  const copy: Record<Exclude<PushState, 'loading'>, { title: string; body: string }> = {
    on: {
      title: 'Notifications are on',
      body:
        devices > 1
          ? `Offers, messages and deal updates will pop up on ${devices} devices, even when AkuafoDwa is closed.`
          : 'Offers, messages and deal updates will pop up here, even when AkuafoDwa is closed.',
    },
    off: {
      title: 'Get offer alerts instantly',
      body: 'Turn on notifications and be first to hear about offers, counter-offers and agreed deals — even with the app closed.',
    },
    denied: {
      title: 'Notifications are blocked',
      body: 'Your browser is blocking notifications for this site. Allow them in the site settings (the lock icon in the address bar) to get deal alerts.',
    },
    unsupported: {
      title: 'Push not supported here',
      body: 'This browser cannot receive push notifications. Chrome, Edge or Samsung Internet on Android, or any modern desktop browser, will work.',
    },
  }

  const view = copy[state === 'loading' ? 'off' : state]

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">
        {state === 'on' ? (
          <Bell size={17} className="text-[#C49000]" aria-hidden="true" />
        ) : (
          <BellOff size={17} className="text-[#2E7D32] dark:text-[#6FBF73]" aria-hidden="true" />
        )}
        Notifications
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{view.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {state === 'on' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={disable}
              disabled={busy}
              className="rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <BellOff size={14} className="mr-1.5" />}
              Turn off
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={sendTest}
              disabled={busy}
              className="rounded-full border-[#FBC02D] text-[#124116] dark:text-[#6FBF73] hover:bg-[#FBC02D]/20"
            >
              <Send size={14} className="mr-1.5" /> Send test
            </Button>
          </>
        )}
        {(state === 'off' || state === 'loading') && (
          <Button
            size="sm"
            onClick={enable}
            disabled={busy || state === 'loading'}
            className="rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
          >
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Bell size={14} className="mr-1.5" />}
            Turn on notifications
          </Button>
        )}
      </div>
    </div>
  )
}
