'use client'

import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(available: boolean) => void>()

function notify(available: boolean) {
  listeners.forEach((fn) => fn(available))
}

/** Registers the service worker and remembers the install prompt. Mount once, renders nothing. */
export function PwaRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const onLoad = () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          /* SW is a progressive enhancement; ignore failures */
        })
      }
      if (document.readyState === 'complete') onLoad()
      else window.addEventListener('load', onLoad, { once: true })
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      notify(true)
    }
    const onInstalled = () => {
      deferredPrompt = null
      notify(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  return null
}

/**
 * Install button that only renders when the browser offers installation
 * (Android Chrome, desktop Chrome/Edge). iOS users install via Share.
 */
export function InstallAppButton({ className, label = 'Install app' }: { className?: string; label?: string }) {
  const [available, setAvailable] = useState(
    // A prompt captured before mount is kept in module scope.
    () => deferredPrompt !== null
  )

  useEffect(() => {
    listeners.add(setAvailable)
    return () => {
      listeners.delete(setAvailable)
    }
  }, [])

  if (!available) return null

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      deferredPrompt = null
      setAvailable(false)
    }
  }

  return (
    <Button
      onClick={install}
      variant="outline"
      aria-label="Install AkuafoDwa app on this device"
      className={
        className ??
        'bg-transparent border-[#FBC02D]/60 text-[#FFFDF5] hover:bg-white/10 hover:text-white rounded-full h-9 px-4'
      }
    >
      <Download size={16} className="mr-1.5" />
      {label}
    </Button>
  )
}
