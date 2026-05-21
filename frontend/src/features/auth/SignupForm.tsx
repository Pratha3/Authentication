'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { signupSchema, type SignupInput } from './schemas'
import { authApi, setToken } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { createOrganizerProfile, fetchProfile, updateProfile } from '@/services/api/profiles.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/constants'

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next')
  const { setUser, setToken: storeToken, setProfile } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupInput) => {
    setIsLoading(true)
    try {
      const { token, user } = await authApi.signup(values.email, values.password, values.full_name)
      setToken(token)
      storeToken(token)
      setUser(user)

      const { data: profile } = await fetchProfile(user.id)
      let nextProfile = profile

      // Save phone to profile if provided
      if (values.phone) {
        const { data: updated } = await updateProfile(user.id, { phone: values.phone } as any)
        if (updated) nextProfile = updated
      }

      if (next === ROUTES.ORGANIZER.CREATE) {
        await createOrganizerProfile({
          user_id: user.id,
          organization_name: values.full_name,
          description: null,
          logo_url: null,
          website: null,
          social_links: null,
          verification_status: 'pending',
          verified_at: null,
        })
        const refreshed = await fetchProfile(user.id)
        nextProfile = refreshed.data
      }

      setProfile(nextProfile)
      toast.success('Account created! Welcome to EventSphere.')
      router.push(next ?? ROUTES.DISCOVER)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground">Join thousands discovering local events</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" placeholder="Alex Johnson" autoComplete="name" {...register('full_name')} />
          {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            Phone Number
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            autoComplete="tel"
            {...register('phone')}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          <p className="text-xs text-muted-foreground">For mobile event reminders & confirmations</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </motion.div>
  )
}
