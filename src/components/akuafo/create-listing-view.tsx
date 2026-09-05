'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import {
  ImagePlus,
  Star,
  Trash2,
  Leaf,
  HandCoins,
  MessageSquareText,
  Loader2,
  Camera,
} from 'lucide-react'
import { api } from '@/lib/api'
import { GHANA_REGIONS, UNITS } from '@/lib/constants'
import { PRODUCTION_METHODS, FULFILLMENT_OPTIONS } from '@/lib/types'
import { useApp } from './store'
import { SectionHeading } from './misc'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CreateListingView() {
  const { user, userLoading, categories, navigate, openAuth, t } = useApp()
  const [title, setTitle] = useState('')
  const [categoryChoice, setCategoryChoice] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [priceNegotiable, setPriceNegotiable] = useState(true)
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Optional structured details
  const [grade, setGrade] = useState('')
  const [packaging, setPackaging] = useState('')
  const [harvestInfo, setHarvestInfo] = useState('')
  const [productionMethod, setProductionMethod] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [fulfillment, setFulfillment] = useState('PICKUP')

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <HandCoins size={44} className="mx-auto text-[#2E7D32] dark:text-[#6FBF73]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-[#1B5E20] dark:text-[#EDF7EE]">Sign in to start selling</h1>
        <p className="mt-2 text-muted-foreground">
          Create a free account to list your produce. It takes less than two minutes.
        </p>
        <Button
          onClick={() => openAuth('register')}
          className="mt-6 rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] px-6 text-[#FFFDF5] dark:text-[#071A0C] hover:bg-[#124116] dark:hover:bg-[#FFFDF5]"
        >
          Create your free account
        </Button>
      </div>
    )
  }

  const uploadFiles = async (files: FileList) => {
    if (!files.length) return
    if (images.length + files.length > 6) {
      toast.error('You can add up to 6 photos per listing.')
      return
    }
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        const res = await api<{ url: string }>('/api/uploads', { method: 'POST', body: form })
        uploaded.push(res.url)
      }
      setImages((prev) => [...prev, ...uploaded])
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} added.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (images.length === 0) {
      toast.error('Please add at least one photo of your produce.')
      return
    }
    if (!categoryChoice) {
      toast.error('Please choose a category.')
      return
    }
    setSubmitting(true)
    try {
      const isCustom = categoryChoice === '__custom__'
      await api('/api/listings', {
        method: 'POST',
        json: {
          title,
          description,
          price: parseFloat(price),
          unit,
          quantity: parseFloat(quantity),
          region,
          city: city || undefined,
          priceNegotiable,
          categoryId: isCustom ? undefined : categoryChoice,
          newCategory: isCustom ? newCategory : undefined,
          images,
          grade: grade || undefined,
          packaging: packaging || undefined,
          harvestInfo: harvestInfo || undefined,
          productionMethod: productionMethod || undefined,
          minOrder: minOrder ? parseFloat(minOrder) : undefined,
          fulfillment,
        },
      })
      toast.success('Your produce is now live on the market! 🎉')
      navigate('/my-listings')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create listing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SectionHeading
        title="List your produce"
        subtitle="Set your price and quantity, and buyers will come with offers. Listing is free."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="space-y-6">
          {/* Photos */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE] flex items-center gap-2">
              <ImagePlus size={17} className="text-[#2E7D32] dark:text-[#6FBF73]" /> Photos <span className="text-xs font-normal text-muted-foreground">(up to 6, first one is the cover)</span>
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground flex gap-1.5">
              <Camera size={13} className="mt-0.5 shrink-0 text-[#2E7D32] dark:text-[#6FBF73]" />
              Upload clear photos of the actual product you are selling. Show the produce itself, the
              packaging and the quantity where useful. Listings with real, sharp photos win buyer
              trust much faster. Please avoid blurry photos or pictures taken from the internet.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((url, i) => (
                <div
                  key={url}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-xl ring-2 cursor-pointer',
                    i === 0 ? 'ring-[#2E7D32]' : 'ring-transparent hover:ring-[#FBC02D]'
                  )}
                  onClick={() => setImages((prev) => [url, ...prev.filter((u) => u !== url)])}
                  title={i === 0 ? 'Cover photo' : 'Click to make this the cover'}
                >
                  <Image src={url} alt={`Photo ${i + 1}`} fill sizes="120px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded-md bg-[#1B5E20]/85 px-1.5 py-0.5 text-[9px] font-semibold text-[#FFFDF5] flex items-center gap-0.5">
                      <Star size={8} className="fill-current" /> Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImages((prev) => prev.filter((u) => u !== url))
                    }}
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end opacity-0 transition-opacity outline-none focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <span className="m-1 rounded-md bg-[#124116]/70 p-1 text-white transition-colors hover:bg-red-700">
                      <Trash2 size={11} />
                    </span>
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#FBC02D] bg-background/40 text-[#2E7D32] dark:text-[#6FBF73] transition-colors hover:bg-[#FBC02D]/20 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Add photos"
                >
                  {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
                  <span className="text-[11px] font-medium">{uploading ? 'Uploading…' : 'Add photo'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Basics */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE] flex items-center gap-2">
              <Leaf size={17} className="text-[#2E7D32] dark:text-[#6FBF73]" /> What are you selling?
            </h3>

            <div>
              <Label htmlFor="cl-title">Title</Label>
              <Input
                id="cl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fresh Pona Yam Tubers, farm direct"
                className="mt-1.5 bg-background"
                maxLength={120}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={categoryChoice || undefined} onValueChange={setCategoryChoice}>
                  <SelectTrigger className="mt-1.5 bg-background" aria-label="Category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-72">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">➕ Other, type my own</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {categoryChoice === '__custom__' && (
                <div>
                  <Label htmlFor="cl-newcat">New category name</Label>
                  <Input
                    id="cl-newcat"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Mushrooms, Snails, Flowers…"
                    className="mt-1.5 bg-background"
                    maxLength={50}
                  />
                </div>
              )}
              <div>
                <Label>Unit</Label>
                <Select value={unit || undefined} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1.5 bg-background" aria-label="Unit">
                    <SelectValue placeholder="How is it sold?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-72">
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cl-price">Asking price (GH₵ per unit)</Label>
                <Input
                  id="cl-price"
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 35"
                  className="mt-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cl-qty">Quantity available</Label>
                <Input
                  id="cl-qty"
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 200"
                  className="mt-1.5 bg-background"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-background/60 border border-[#FBC02D]/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#124116] dark:text-[#D7EED9]">Open to negotiation?</p>
                <p className="text-xs text-muted-foreground">Buyers can send offers against your asking price.</p>
              </div>
              <Switch checked={priceNegotiable} onCheckedChange={setPriceNegotiable} aria-label="Price negotiable" />
            </div>
          </div>

          {/* Produce details (optional structured fields) */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">Produce details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                All optional, but they help buyers trust and compare listings quickly.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cl-grade">Quality / grade</Label>
                <Input
                  id="cl-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. Grade A, Premium, Standard"
                  className="mt-1.5 bg-background"
                  maxLength={60}
                />
              </div>
              <div>
                <Label htmlFor="cl-packaging">Packaging</Label>
                <Input
                  id="cl-packaging"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  placeholder="e.g. 50kg maxi bag, wooden crate"
                  className="mt-1.5 bg-background"
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="cl-harvest">Harvest info</Label>
                <Input
                  id="cl-harvest"
                  value={harvestInfo}
                  onChange={(e) => setHarvestInfo(e.target.value)}
                  placeholder="e.g. Harvested this week, main season crop"
                  className="mt-1.5 bg-background"
                  maxLength={100}
                />
              </div>
              <div>
                <Label>Production method</Label>
                <Select value={productionMethod || undefined} onValueChange={setProductionMethod}>
                  <SelectTrigger className="mt-1.5 bg-background" aria-label="Production method">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PRODUCTION_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cl-minorder">Minimum order ({unit || 'unit'})</Label>
                <Input
                  id="cl-minorder"
                  type="number"
                  min="0"
                  step="any"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1.5 bg-background"
                />
              </div>
              <div>
                <Label>Fulfilment</Label>
                <Select value={fulfillment} onValueChange={setFulfillment}>
                  <SelectTrigger className="mt-1.5 bg-background" aria-label="Fulfilment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {FULFILLMENT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">Where is it?</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t('region')}</Label>
                <Select value={region || undefined} onValueChange={setRegion}>
                  <SelectTrigger className="mt-1.5 bg-background" aria-label="Region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-72">
                    {GHANA_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cl-city">{t('city_town')} <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="cl-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ejura"
                  className="mt-1.5 bg-background"
                  maxLength={80}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-[#1B5E20] dark:text-[#EDF7EE]">Describe it</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Say as much as you need: variety, quality, where it comes from, storage, transport,
              minimum order, when it is available. Buyers can still scan the details above.
            </p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Freshly harvested pona yam from Ejura. Big, firm tubers with no rot or cuts. We can pack in heaps of 10 tubers for easy loading. Come and inspect at the farm, or we can load onto your truck. Available from now until the end of the major season."
              rows={6}
              className="mt-2 bg-background resize-y"
              required
              minLength={10}
              maxLength={5000}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || uploading}
            className="h-12 w-full rounded-full bg-[#1B5E20] dark:bg-[#4CAF50] font-semibold text-[#FFFDF5] dark:text-[#071A0C] shadow-lg hover:bg-[#124116] dark:hover:bg-[#FFFDF5] text-base"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="mr-2 animate-spin" /> Putting it on the market…
              </>
            ) : (
              <>
                <HandCoins size={17} className="mr-2" /> Publish my listing
              </>
            )}
          </Button>
        </form>

        {/* Side: how it works */}
        <aside className="space-y-4 lg:sticky lg:top-28 self-start">
          <div className="rounded-2xl bg-gradient-to-br from-[#1B5E20] to-[#124116] p-6 text-[#FFFDF5] shadow-lg">
            <h3 className="font-display text-xl font-bold">How selling works</h3>
            <ol className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBC02D] font-bold text-[#1F2937]">1</span>
                <span><strong>List it free.</strong> Photos, price, quantity, your town.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBC02D] font-bold text-[#1F2937]">2</span>
                <span><strong>Receive offers.</strong> Buyers message you with their price and quantity.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBC02D] font-bold text-[#1F2937]">3</span>
                <span><strong>Negotiate &amp; accept.</strong> Counter until it feels right, then agree.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBC02D] font-bold text-[#1F2937]">4</span>
                <span><strong>Deal &amp; get paid.</strong> Contacts open on agreement. Arrange delivery and payment directly.</span>
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-[#FBC02D]/50 bg-background/50 p-4 text-xs leading-relaxed text-muted-foreground flex gap-2.5">
            <MessageSquareText size={16} className="shrink-0 text-[#2E7D32] dark:text-[#6FBF73] mt-0.5" />
            <span>
              Tip: listings with clear photos and honest descriptions get more offers. Mention your
              harvest date and whether buyers can come and inspect.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
