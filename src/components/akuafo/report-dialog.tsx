'use client'

import React, { useState } from 'react'
import { CheckCircle2, Flag, Loader2, ShieldAlert } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import type { StringKey } from '@/lib/i18n'
import { useApp } from './store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type ReportReason = 'SPAM' | 'FAKE' | 'SCAM' | 'WRONG_PRICE' | 'ALREADY_SOLD' | 'OFFENSIVE' | 'OTHER'

export interface ReportReasonDef {
  value: ReportReason
  /** i18n key used inside the dialog (falls back to English for TW). */
  labelKey: StringKey
  /** English label used by the admin Reports table (admin UI is English-only). */
  labelEn: string
}

// The 7 reasons accepted by POST /api/listings/[id]/report — keep in sync there.
export const REPORT_REASONS: ReportReasonDef[] = [
  { value: 'SPAM', labelKey: 'report_reason_spam', labelEn: 'Spam or posted in the wrong category' },
  { value: 'FAKE', labelKey: 'report_reason_fake', labelEn: 'Fake listing or wrong photos' },
  { value: 'SCAM', labelKey: 'report_reason_scam', labelEn: 'Asks for money outside the market' },
  { value: 'WRONG_PRICE', labelKey: 'report_reason_wrong_price', labelEn: 'Misleading price' },
  { value: 'ALREADY_SOLD', labelKey: 'report_reason_already_sold', labelEn: 'Already sold elsewhere' },
  { value: 'OFFENSIVE', labelKey: 'report_reason_offensive', labelEn: 'Offensive content' },
  { value: 'OTHER', labelKey: 'report_reason_other', labelEn: 'Something else' },
]

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.labelEn ?? value
}

const DETAILS_MAX = 500

export function ReportDialog({
  open,
  onOpenChange,
  listingId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  listingId: string
}) {
  const { t } = useApp()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)

  // Fresh form every time the dialog opens. Reset happens during render when
  // the `open` prop flips (React's documented "adjust state when a prop
  // changes" pattern — avoids a setState-in-effect cascading render).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setReason(null)
      setDetails('')
      setPhase('idle')
      setError(null)
      setNeedsAuth(false)
    }
  }

  const submit = async () => {
    if (!reason || phase === 'submitting') return
    setPhase('submitting')
    setError(null)
    setNeedsAuth(false)
    try {
      const trimmed = details.trim()
      await api(`/api/listings/${listingId}/report`, {
        method: 'POST',
        json: { reason, details: trimmed ? trimmed : undefined },
      })
      setPhase('success')
    } catch (e) {
      // Session may have expired between page load and the report — the server
      // answers 401 and we show a friendly "sign in first" note with a close.
      if (e instanceof ApiError && e.status === 401) {
        setNeedsAuth(true)
      } else {
        setError(e instanceof Error ? e.message : t('report_error_generic'))
      }
      setPhase('idle')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (phase !== 'submitting') onOpenChange(v)
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-[#1B5E20] dark:text-[#EDF7EE]">
            <Flag size={20} className="text-[#2E7D32] dark:text-[#6FBF73]" aria-hidden="true" />
            {t('report_listing')}
          </DialogTitle>
          <DialogDescription>
            {phase === 'success'
              ? t('report_success')
              : needsAuth
                ? t('report_error_401')
                : t('report_dialog_intro')}
          </DialogDescription>
        </DialogHeader>

        {phase === 'success' ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9] dark:bg-[#1B3D24]">
              <CheckCircle2 size={30} className="text-[#2E7D32] dark:text-[#6FBF73]" aria-hidden="true" />
            </span>
            <Button
              onClick={() => onOpenChange(false)}
              className="h-11 w-full rounded-full bg-[#1B5E20] font-semibold text-[#FFFDF5] hover:bg-[#124116]"
            >
              {t('report_close')}
            </Button>
          </div>
        ) : needsAuth ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#FBC02D]/60 bg-[#FFFDF5] dark:bg-[#1B3D24]">
              <ShieldAlert size={30} className="text-[#C49000]" aria-hidden="true" />
            </span>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full rounded-full border-[#FBC02D] text-[#124116] hover:bg-[#FBC02D]/20 dark:text-[#6FBF73]"
            >
              {t('report_close')}
            </Button>
          </div>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label={t('report_listing')}
              className="grid max-h-64 gap-2 overflow-y-auto pr-1 nice-scroll"
            >
              {REPORT_REASONS.map((r) => {
                const selected = reason === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setReason(r.value)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#FBC02D]',
                      selected
                        ? 'border-[#2E7D32] bg-[#E8F5E9]/70 dark:border-[#6FBF73] dark:bg-[#1B3D24]/70'
                        : 'border-border bg-background hover:border-[#2E7D32]/40 hover:bg-[#E8F5E9]/40 dark:hover:bg-[#1B3D24]/40'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                        selected ? 'border-[#1B5E20] dark:border-[#6FBF73]' : 'border-muted-foreground/40'
                      )}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-[#1B5E20] dark:bg-[#6FBF73]" />}
                    </span>
                    <span className="font-medium text-foreground/90">{t(r.labelKey)}</span>
                  </button>
                )
              })}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="report-details" className="text-sm font-medium">
                  {t('report_details_label')}
                </label>
                <span className="text-[11px] text-muted-foreground" aria-hidden="true">
                  {details.length}/{DETAILS_MAX}
                </span>
              </div>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, DETAILS_MAX))}
                placeholder={t('report_details_placeholder')}
                rows={3}
                maxLength={DETAILS_MAX}
                className="mt-1.5 resize-none bg-background"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#B3261E] dark:text-[#E4574E]">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                onClick={submit}
                disabled={!reason || phase === 'submitting'}
                className="h-11 w-full rounded-full bg-[#1B5E20] font-semibold text-[#FFFDF5] hover:bg-[#124116] disabled:opacity-50"
              >
                {phase === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t('report_sending')}
                  </>
                ) : (
                  t('report_submit')
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
