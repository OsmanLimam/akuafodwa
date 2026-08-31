'use client'

import React, { useEffect, useState } from 'react'
import { api, storeSessionToken } from '@/lib/api'
import type { ApiUser } from '@/lib/types'
import { useApp } from './store'
import { DemoHint } from './misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { SELLER_TYPES } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AuthDialog() {
  const {
    authOpen,
    authMode,
    closeAuth,
    setAuthMode,
    applyUser,
    runPendingAction,
    navigate,
    t,
  } = useApp()

  const handleSuccess = (user: ApiUser, registered: boolean) => {
    // Apply the session user directly from the response: works even when
    // cookies and storage are blocked, and skips a fragile /api/auth/me round-trip.
    applyUser(user)
    // Resume whatever the user was trying to do (offer dialog, save, etc.)
    // before closeAuth() clears the queue. Returns true if something was resumed.
    const resumed = runPendingAction()
    closeAuth()
    if (registered) {
      toast.success(`Akwaaba, ${user.name.split(' ')[0]}! Your account is ready. 🎉`)
      if (!resumed) navigate('/sell')
    } else {
      toast.success(`Akwaaba, ${user.name.split(' ')[0]}! 👋`)
    }
  }

  return (
    <Dialog open={authOpen} onOpenChange={(v) => !v && closeAuth()}>
      <DialogContent className="rounded-3xl sm:max-w-md overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 kente-stripes" aria-hidden="true" />
        <DialogHeader className="pt-2">
          <DialogTitle className="font-display text-2xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">
            {authMode === 'login' ? t('welcome_back') : t('join_free')}
          </DialogTitle>
          <DialogDescription>
            {authMode === 'login'
              ? 'Sign in to make offers, manage listings and close deals.'
              : 'Buy, sell and negotiate farm produce across all 16 regions of Ghana.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
          <TabsList className="w-full rounded-full bg-muted p-1">
            <TabsTrigger value="login" className="flex-1 rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
              {t('sign_in')}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1 rounded-full data-[state=active]:bg-[#1B5E20] data-[state=active]:text-[#FFFDF5]">
              {t('create_account')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-2">
            <LoginForm onSuccess={(user) => handleSuccess(user, false)} />
          </TabsContent>

          <TabsContent value="register" className="mt-2">
            <RegisterForm onSuccess={(user) => handleSuccess(user, true)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function LoginForm({ onSuccess }: { onSuccess: (u: ApiUser) => void }) {
  const { t } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const data = await api<{ user: ApiUser; token?: string }>('/api/auth/login', {
        method: 'POST',
        json: { email, password },
      })
      if (data.token) storeSessionToken(data.token)
      onSuccess(data.user)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="li-email">{t('email')}</Label>
        <Input
          id="li-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 bg-background"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <Label htmlFor="li-pass">{t('password')}</Label>
        <Input
          id="li-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1.5 bg-background"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] font-semibold text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
        {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : t('sign_in')}
      </Button>
      <DemoHint onFill={(e, p) => { setEmail(e); setPassword(p) }} />
    </form>
  )
}

function RegisterForm({ onSuccess }: { onSuccess: (u: ApiUser) => void }) {
  const { t } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [sellerType, setSellerType] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const data = await api<{ user: ApiUser; token?: string }>('/api/auth/register', {
        method: 'POST',
        json: {
          name,
          email,
          phone: phone || undefined,
          password,
          sellerType: sellerType || undefined,
        },
      })
      if (data.token) storeSessionToken(data.token)
      onSuccess(data.user)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="rg-name">{t('full_name')}</Label>
        <Input id="rg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ama Serwaa" className="mt-1.5 bg-background" minLength={2} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rg-email">{t('email')}</Label>
          <Input id="rg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 bg-background" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="rg-phone">{t('phone_number')} <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="rg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="024 000 0000" className="mt-1.5 bg-background" />
        </div>
      </div>
      <div>
        <Label htmlFor="rg-type">I am a... <span className="text-muted-foreground">(helps buyers trust you)</span></Label>
        <Select value={sellerType} onValueChange={setSellerType}>
          <SelectTrigger id="rg-type" className="mt-1.5 bg-background">
            <SelectValue placeholder="Choose your role (optional)" />
          </SelectTrigger>
          <SelectContent>
            {SELLER_TYPES.map((st) => (
              <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="rg-pass">{t('password')}</Label>
        <Input id="rg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="mt-1.5 bg-background" autoComplete="new-password" minLength={8} required />
      </div>
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] font-semibold text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]">
        {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Create my free account'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        One account to buy <em>and</em> sell. Farmers, traders and market women all welcome.
      </p>
    </form>
  )
}
