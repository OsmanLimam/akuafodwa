'use client'

import React, { useEffect, useState } from 'react'
import { Download, Share, PlusSquare, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
 * Install button.
 * - Android/desktop Chrome & Edge: native install prompt via beforeinstallprompt.
 * - iPhone/iPad Safari: no prompt API exists, so the button opens a short
 *   Share -> Add to Home Screen guide instead.
 * - Already installed or unsupported: renders nothing.
 */
export function InstallAppButton({ className, label = 'Install app' }: { className?: string; label?: string }) {
  const [available, setAvailable] = useState(
    // A prompt captured before mount is kept in module scope.
    () => deferredPrompt !== null
  )
  const [iosDevice, setIosDevice] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    listeners.add(setAvailable)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    const ua = navigator.userAgent
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    // Deferred (not synchronous in the effect) to avoid cascading renders and
    // hydration mismatches: server HTML renders nothing for iOS until here.
    const t = window.setTimeout(() => {
      if (isIOS && !standalone) setIosDevice(true)
    }, 0)
    return () => {
      listeners.delete(setAvailable)
      window.clearTimeout(t)
    }
  }, [])

  if (!available && !iosDevice) return null

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
    <>
      <Button
        onClick={() => (available ? void install() : setGuideOpen(true))}
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

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-[#1B5E20]">Get the AkuafoDwa app on your iPhone</DialogTitle>
            <DialogDescription>
              Three quick steps — the market lives on your home screen afterwards.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B5E20] text-xs font-bold text-[#FFFDF5]">1</span>
              <span className="flex items-center gap-1.5">
                Tap the <Share size={16} className="inline text-[#2E7D32]" aria-hidden="true" /> <strong>Share</strong> button at the bottom of Safari
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B5E20] text-xs font-bold text-[#FFFDF5]">2</span>
              <span className="flex items-center gap-1.5">
                Scroll down and tap <PlusSquare size={16} className="inline text-[#2E7D32]" aria-hidden="true" /> <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B5E20] text-xs font-bold text-[#FFFDF5]">3</span>
              <span className="flex items-center gap-1.5">
                Tap <strong>Add</strong> — look for the AkuafoDwa basket icon <CheckCircle2 size={16} className="inline text-[#2E7D32]" aria-hidden="true" />
              </span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  )
}
