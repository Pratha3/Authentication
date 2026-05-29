'use client'
import { useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { useEventsStore } from '@/store/events.store'
import { fetchOrganizerProfile } from '@/services/api/profiles.service'
import { createEvent, updateEvent, type EventPayload } from '@/services/api/events.service'
import { uploadApi } from '@/lib/api'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EVENT_CATEGORIES, ROUTES } from '@/constants'
import { slugify } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'

const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  short_description: z.string().max(160).optional(),
  category: z.string().min(1, 'Category is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  city: z.string().optional(),
  address: z.string().optional(),
  is_online: z.boolean(),
  online_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_free: z.boolean(),
  price: z.coerce.number().min(0),
  capacity: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  tags: z.string().optional(),
}).refine(
  (d) => !d.is_online || !d.online_url || d.online_url === '' || d.online_url.startsWith('http'),
  { message: 'Online URL must start with http', path: ['online_url'] }
).refine(
  (d) => new Date(d.end_date) >= new Date(d.start_date),
  { message: 'End date must be after or equal to start date', path: ['end_date'] }
)

type EventFormInput = z.infer<typeof eventSchema>

interface Props {
  mode: 'create' | 'edit'
  existing?: Event
}

export function EventFormClient({ mode, existing }: Props) {
  const { user } = useAuthStore()
  const { upsertEvent } = useEventsStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>(existing?.banner_url ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<EventFormInput>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormInput>,
    defaultValues: existing ? {
      title: existing.title,
      description: existing.description,
      short_description: existing.short_description ?? '',
      category: existing.category,
      start_date: existing.start_date?.slice(0, 16),
      end_date: existing.end_date?.slice(0, 16),
      city: existing.city ?? '',
      address: existing.address ?? '',
      is_online: existing.is_online,
      online_url: existing.online_url ?? '',
      is_free: existing.is_free,
      price: existing.price,
      capacity: existing.capacity ?? '',
      tags: existing.tags?.join(', ') ?? '',
    } : {
      is_free: true as boolean,
      is_online: false as boolean,
      price: 0,
    },
  })

  const isOnline = watch('is_online')
  const isFree = watch('is_free')

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Use a JPG, PNG, WEBP, or GIF image')
      return
    }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (values: EventFormInput) => {
    if (!user) return
    setIsLoading(true)
    setFormError(null)
    try {
      // Verify organizer profile exists
      const { data: org } = await fetchOrganizerProfile(user.id)
      if (!org) {
        toast.error('You need an organizer profile to create events. Please set one up first.')
        setIsLoading(false)
        return
      }

      // Upload banner if a new file was selected
      let bannerUrl = existing?.banner_url ?? null
      if (bannerFile) {
        const { url, error } = await uploadApi.upload('event-images', bannerFile)
        if (error || !url) {
          toast.error('Failed to upload banner image')
          setIsLoading(false)
          return
        }
        bannerUrl = url
      }

      const payload: EventPayload = {
        title: values.title,
        description: values.description,
        shortDescription: values.short_description || null,
        category: values.category,
        startDate: new Date(values.start_date).toISOString(),
        endDate: new Date(values.end_date).toISOString(),
        city: values.city || null,
        address: values.address || null,
        isOnline: values.is_online,
        onlineUrl: values.is_online ? (values.online_url || null) : null,
        isFree: values.is_free,
        price: values.is_free ? 0 : values.price,
        capacity: values.capacity ? Number(values.capacity) : null,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        bannerUrl,
        slug: mode === 'create'
          ? slugify(values.title) + '-' + Date.now()
          : existing!.slug,
        status: existing?.status ?? 'upcoming',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      }

      const result = mode === 'create'
        ? await createEvent(payload)
        : await updateEvent(existing!.id, payload)

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      if (result.data) upsertEvent(result.data)
      toast.success(mode === 'create' ? 'Event created successfully!' : 'Event updated successfully!')
      router.push(ROUTES.ORGANIZER.DASHBOARD)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requiredRole="organizer">
      <main className="container max-w-3xl py-8 space-y-6">
        <h1 className="text-2xl font-bold">{mode === 'create' ? 'Create New Event' : 'Edit Event'}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          {/* Banner upload */}
          <div className="space-y-2">
            <Label>Event Banner</Label>
            <label className={cn(
              'relative flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors overflow-hidden bg-muted/30',
              'border-border/50 hover:border-primary/50'
            )}>
              {bannerPreview ? (
                <Image src={bannerPreview} alt="Banner preview" fill className="object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP - max 5MB</p>
                </div>
              )}
              <input type="file" className="sr-only" accept="image/*" onChange={handleBannerChange} />
            </label>
          </div>

          {/* Title & Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Event Title *</Label>
              <Input placeholder="Summer Tech Meetup 2025" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select category…</option>
                    {EVENT_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea rows={5} placeholder="Describe your event in detail…" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>
              Short Description{' '}
              <span className="text-muted-foreground text-xs">(shown in cards, max 160 chars)</span>
            </Label>
            <Input placeholder="One-line summary…" {...register('short_description')} />
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date & Time *</Label>
              <Input type="datetime-local" {...register('start_date')} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End Date & Time *</Label>
              <Input type="datetime-local" {...register('end_date')} />
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Controller
                name="is_online"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="is_online"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                )}
              />
              <Label htmlFor="is_online" className="cursor-pointer">Online Event</Label>
            </div>
            {isOnline ? (
              <div className="space-y-2">
                <Label>Online URL</Label>
                <Input placeholder="https://meet.google.com/…" {...register('online_url')} />
                {errors.online_url && <p className="text-sm text-destructive">{errors.online_url.message}</p>}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="Mumbai" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input placeholder="123 Main St" {...register('address')} />
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Capacity */}
          <div className="grid gap-4 sm:grid-cols-3 items-end">
            <div className="flex items-center gap-3 pb-2">
              <Controller
                name="is_free"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                )}
              />
              <Label htmlFor="is_free" className="cursor-pointer">Free Event</Label>
            </div>
            {!isFree && (
              <div className="space-y-2">
                <Label>Price (INR)</Label>
                <Input type="number" min={0} placeholder="499" {...register('price')} />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label>
                Capacity{' '}
                <span className="text-muted-foreground text-xs">(blank = unlimited)</span>
              </Label>
              <Input type="number" min={1} placeholder="100" {...register('capacity')} />
              {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>
              Tags{' '}
              <span className="text-muted-foreground text-xs">(comma separated)</span>
            </Label>
            <Input placeholder="networking, startups, tech" {...register('tags')} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === 'create' ? 'Creating…' : 'Saving…'}</>
                : mode === 'create' ? 'Create Event' : 'Save Changes'
              }
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </AuthGuard>
  )
}
