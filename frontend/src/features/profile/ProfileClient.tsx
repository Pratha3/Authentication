'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Loader2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { updateProfile } from '@/services/api/profiles.service'
import { uploadAvatar } from '@/services/storage/upload.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { getInitials } from '@/lib/utils'
import { EVENT_CATEGORIES } from '@/constants'
import { cn } from '@/lib/utils'
import type { EventCategory } from '@/types'

const profileSchema = z.object({
  full_name: z.string().min(2).max(50),
  bio: z.string().max(300).optional(),
  phone: z.string()
    .refine(val => !val || val.replace(/\D/g, '').length >= 7, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  location: z.string().optional(),
})
type ProfileInput = z.infer<typeof profileSchema>

export function ProfileClient() {
  const { user, profile, setProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<EventCategory[]>(profile?.interests ?? [])

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '',
      location: profile?.location ?? '',
    },
  })

  const onSubmit = async (values: ProfileInput) => {
    if (!user) return
    setIsLoading(true)
    const { data, error } = await updateProfile(user.id, { ...values, interests: selectedInterests })
    if (error) toast.error(error)
    else { setProfile(data); toast.success('Profile updated!') }
    setIsLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    const { url, error } = await uploadAvatar(file)
    if (error || !url) { toast.error('Failed to upload avatar'); setUploadingAvatar(false); return }
    const { data, error: updateErr } = await updateProfile(user.id, { avatar_url: url })
    if (updateErr) toast.error(updateErr)
    else { setProfile(data); toast.success('Avatar updated!') }
    setUploadingAvatar(false)
  }

  const toggleInterest = (cat: EventCategory) => {
    setSelectedInterests(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  return (
    <AuthGuard>
      <main className="container max-w-2xl py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url ?? ''} />
                <AvatarFallback className="text-xl">{getInitials(profile?.full_name ?? 'U')}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90">
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                <input type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="font-semibold">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-block text-xs rounded-full px-2 py-0.5 mt-1 bg-primary/10 text-primary capitalize">{profile?.role}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register('full_name')} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea rows={3} placeholder="Tell people about yourself…" {...register('bio')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+91 98765 43210" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                <p className="text-xs text-muted-foreground">Used for mobile notifications</p>
              </div>
              <div className="space-y-2">
                <Label>City / Location</Label>
                <Input placeholder="Mumbai, India" {...register('location')} />
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleInterest(cat.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all',
                      selectedInterests.includes(cat.value) ? cat.color : 'border-border/50 text-muted-foreground hover:border-border'
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
            </Button>
          </form>
        </motion.div>
      </main>
    </AuthGuard>
  )
}
