'use client'

import React, { useMemo, useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { api } from '@/lib/api'
import { GHANA_REGIONS, UNITS } from '@/lib/constants'
import { FULFILLMENT_OPTIONS, PRODUCTION_METHODS } from '@/lib/types'
import type { ApiListing } from '@/lib/types'
import { useApp } from './store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const DESCRIPTION_MAX = 5000
const NONE = '__none__'

/**
 * Full edit dialog for a seller's own listing (audit finding: the old dialog
 * only edited price & quantity while PATCH /api/listings/[id] already accepts
 * every field). Mirrors the sell form's field styles and posts to the same
 * PATCH handler. Category is intentionally NOT editable — the edit API has no
 * categoryId support. Photos are edited nowhere (out of scope by design).
 */
export function EditListingDialog({
  listing,
  onClose,
  onSaved,
}: {
  listing: ApiListing
  onClose: () => void
  onSaved: (updated: ApiListing) => void
}) {
  const { t } = useApp()

  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description)
  const [price, setPrice] = useState(String(listing.price))
  const [unit, setUnit] = useState(listing.unit)
  const [quantity, setQuantity] = useState(String(listing.quantity))
  const [priceNegotiable, setPriceNegotiable] = useState(listing.priceNegotiable)
  const [region, setRegion] = useState(listing.region)
  const [city, setCity] = useState(listing.city ?? '')
  const [grade, setGrade] = useState(listing.grade ?? '')
  const [packaging, setPackaging] = useState(listing.packaging ?? '')
  const [harvestInfo, setHarvestInfo] = useState(listing.harvestInfo ?? '')
  const [productionMethod, setProductionMethod] = useState(listing.productionMethod ?? '')
  const [minOrder, setMinOrder] = useState(listing.minOrder === null ? '' : String(listing.minOrder))
  const [fulfillment, setFulfillment] = useState(listing.fulfillment)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep the current value selectable even if it is not one of the standard
  // options (the edit API accepts any string for unit / production method).
  const unitOptions = useMemo(() => {
    const base = UNITS as readonly string[]
    return base.includes(listing.unit) ? base : [listing.unit, ...base]
  }, [listing.unit])

  const productionOptions = useMemo(() => {
    const base = PRODUCTION_METHODS as readonly string[]
    return listing.productionMethod && !base.includes(listing.productionMethod)
      ? [listing.productionMethod, ...base]
      : base
  }, [listing.productionMethod])

  // Client-side mirror of the PATCH validation rules (title 3-120,
  // description 10-5000, price > 0, quantity > 0, minOrder ≤ quantity).
  const validate = (): string | null => {
    const tLen = title.trim().length
    if (tLen < 3 || tLen > 120) return 'Title must be 3-120 characters.'
    const dLen = description.trim().length
    if (dLen < 10 || dLen > 5000) return 'Description must be 10 to 5000 characters.'
    const p = parseFloat(price)
    if (isNaN(p) || p <= 0 || p > 10_000_000) return 'Please enter a valid price greater than 0.'
    const qn = parseFloat(quantity)
    if (isNaN(qn) || qn <= 0 || qn > 10_000_000) return 'Please enter a valid quantity greater than 0.'
    if (!unit.trim()) return 'Please choose how your produce is sold (unit).'
    if (!region.trim()) return 'Please select a region.'
    if (minOrder.trim() !== '') {
      const mo = parseFloat(minOrder)
      if (isNaN(mo) || mo < 0) return 'Please enter a valid minimum order.'
      if (mo > qn) return 'Minimum order cannot be more than the quantity available.'
    }
    return null
  }

  const save = async () => {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      // PATCH /api/listings/[id] — same handler the sell form's fields map to.
      // Empty optional fields are sent as null so the API clears them.
      const { listing: updated } = await api<{ listing: ApiListing }>(
        `/api/listings/${listing.id}`,
        {
          method: 'PATCH',
          json: {
            title: title.trim(),
            description: description.trim(),
            price: parseFloat(price),
            unit: unit.trim(),
            quantity: parseFloat(quantity),
            priceNegotiable,
            region,
            city: city.trim() || null,
            grade: grade.trim() || null,
            packaging: packaging.trim() || null,
            harvestInfo: harvestInfo.trim() || null,
            productionMethod: productionMethod || null,
            minOrder: minOrder.trim() === '' ? null : parseFloat(minOrder),
            fulfillment,
          },
        },
      )
      toast.success(t('edit_success'))
      onSaved(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update the listing.')
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose()
      }}
    >
      <DialogContent className="nice-scroll max-h-[92dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl text-[#1B5E20] dark:text-[#EDF7EE]">
            <Pencil size={18} className="text-[#2E7D32] dark:text-[#6FBF73]" aria-hidden="true" />
            {t('edit_listing')}
          </DialogTitle>
          <DialogDescription>{t('edit_listing_intro')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="el-title">{t('field_title')}</Label>
            <Input
              id="el-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fresh Pona Yam Tubers, farm direct"
              className="mt-1.5 h-11 bg-background"
              maxLength={120}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="el-price">{t('field_price')}</Label>
              <Input
                id="el-price"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 35"
                className="mt-1.5 h-11 bg-background"
              />
            </div>
            <div>
              <Label htmlFor="el-qty">{t('quantity_available')}</Label>
              <Input
                id="el-qty"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 200"
                className="mt-1.5 h-11 bg-background"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('field_unit')}</Label>
              <Select value={unit || undefined} onValueChange={setUnit}>
                <SelectTrigger className="mt-1.5 h-11 bg-background" aria-label={t('field_unit')}>
                  <SelectValue placeholder="How is it sold?" />
                </SelectTrigger>
                <SelectContent className="nice-scroll max-h-72 rounded-xl">
                  {unitOptions.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('region')}</Label>
              <Select value={region || undefined} onValueChange={setRegion}>
                <SelectTrigger className="mt-1.5 h-11 bg-background" aria-label={t('region')}>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="nice-scroll max-h-72 rounded-xl">
                  {GHANA_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="el-city">
              {t('city_town')} <span className="text-muted-foreground">({t('optional')})</span>
            </Label>
            <Input
              id="el-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Ejura"
              className="mt-1.5 h-11 bg-background"
              maxLength={80}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#FBC02D]/50 bg-background/60 px-4 py-3">
            <p className="text-sm font-medium text-[#124116] dark:text-[#D7EED9]">
              {t('price_negotiable')}
            </p>
            <Switch
              checked={priceNegotiable}
              onCheckedChange={setPriceNegotiable}
              aria-label={t('price_negotiable')}
            />
          </div>

          <div>
            <Label>{t('field_fulfillment')}</Label>
            <Select value={fulfillment} onValueChange={setFulfillment}>
              <SelectTrigger className="mt-1.5 h-11 bg-background" aria-label={t('field_fulfillment')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {FULFILLMENT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional structured details (same fields as the sell form) */}
          <div className="space-y-4 rounded-2xl border border-border bg-background/40 p-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">
                {t('produce_details')}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">({t('optional')})</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="el-grade">{t('field_grade')}</Label>
                <Input
                  id="el-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. Grade A, Premium, Standard"
                  className="mt-1.5 h-11 bg-background"
                  maxLength={60}
                />
              </div>
              <div>
                <Label htmlFor="el-packaging">{t('field_packaging')}</Label>
                <Input
                  id="el-packaging"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  placeholder="e.g. 50kg maxi bag, wooden crate"
                  className="mt-1.5 h-11 bg-background"
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="el-harvest">{t('field_harvest')}</Label>
                <Input
                  id="el-harvest"
                  value={harvestInfo}
                  onChange={(e) => setHarvestInfo(e.target.value)}
                  placeholder="e.g. Harvested this week, main season crop"
                  className="mt-1.5 h-11 bg-background"
                  maxLength={100}
                />
              </div>
              <div>
                <Label>{t('field_production')}</Label>
                <Select
                  value={productionMethod || undefined}
                  onValueChange={(v) => setProductionMethod(v === NONE ? '' : v)}
                >
                  <SelectTrigger className="mt-1.5 h-11 bg-background" aria-label={t('field_production')}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="nice-scroll max-h-72 rounded-xl">
                    {productionOptions.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                    <SelectItem value={NONE}>None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="el-minorder">
                  {t('minimum_order')} ({unit || 'unit'})
                </Label>
                <Input
                  id="el-minorder"
                  type="number"
                  min="0"
                  step="any"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1.5 h-11 bg-background"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="el-description">{t('description')}</Label>
              <span className="text-[11px] text-muted-foreground" aria-hidden="true">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="el-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
              rows={5}
              className="mt-1.5 resize-y bg-background"
              maxLength={DESCRIPTION_MAX}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#B3261E] dark:text-[#E4574E]">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="h-11 rounded-full border-[#FBC02D] text-[#124116] dark:text-[#6FBF73]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={busy}
            className="h-11 rounded-full bg-[#1B5E20] font-semibold text-[#FFFDF5] hover:bg-[#124116] dark:bg-[#4CAF50] dark:text-[#071A0C] dark:hover:bg-[#FFFDF5] disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> {t('saving')}
              </>
            ) : (
              t('save_changes')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
