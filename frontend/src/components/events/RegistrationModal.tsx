'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, Clock, Users, MapPin, Calendar, X, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { registerForEvent } from '@/services/api/registrations.service'
import { useAuthStore } from '@/store/auth.store'
import { cn, formatDateTime, formatCurrency, getCapacityPercentage } from '@/lib/utils'
import { EVENT_STATUS_CONFIG } from '@/constants'
import type { Event } from '@/types'

// ── Validation ───────────────────────────────────────────────────────────────
const attendeeSchema = z.object({
  email: z.string().email('Enter a valid email').min(1, 'Email is required'),
  phone: z.string()
    .refine(val => !val || val.replace(/\D/g, '').length >= 7, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dietaryRequirements: z.string().max(200).optional(),
  specialRequests: z.string().max(500).optional(),
  emergencyContact: z.string().optional(),
})
type AttendeeFormData = z.infer<typeof attendeeSchema>

interface RegistrationModalProps {
  event: Event | null
  open: boolean
  onClose: () => void
  onSuccess?: (updates: Partial<Event>) => void
}

type Step = 'details' | 'form' | 'success'

export function RegistrationModal({ event, open, onClose, onSuccess }: RegistrationModalProps) {
  const [step, setStep] = useState<Step>('details')
  const [isLoading, setIsLoading] = useState(false)
  const [ticketCode, setTicketCode] = useState('')
  const [regStatus, setRegStatus] = useState<'confirmed' | 'waitlisted'>('confirmed')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { user, profile } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AttendeeFormData>({
    resolver: zodResolver(attendeeSchema),
    defaultValues: {
      email: profile?.email ?? user?.email ?? '',
      name: profile?.full_name ?? user?.name ?? '',
    },
  })

  const handleClose = () => {
    onClose()
    setTimeout(() => { setStep('details'); setSubmitError(null); reset() }, 300)
  }

  const onSubmit = async (data: AttendeeFormData) => {
    if (!user || !event) return
    setIsLoading(true)
    setSubmitError(null)
    try {
      const { data: reg, error } = await registerForEvent(event.id, user.id, {
        phone: data.phone,
        dietaryRequirements: data.dietaryRequirements || undefined,
        specialRequests: data.specialRequests || undefined,
        emergencyContact: data.emergencyContact || undefined,
        answers: { registrationEmail: data.email, registrationName: data.name },
      })
      if (error || !reg) {
        const message = error ?? 'Registration failed'
        setSubmitError(message)
        toast.error(message)
        return
      }
      setTicketCode((reg as any).ticketCode ?? '')
      setRegStatus((reg as any).status ?? 'confirmed')
      setStep('success')
      onSuccess?.({
        is_registered: true,
        current_attendees: (event.current_attendees ?? 0) + ((reg as any).status === 'confirmed' ? 1 : 0),
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!open || !event) return null

  const statusConfig = EVENT_STATUS_CONFIG[event.status]
  const capacityPct = getCapacityPercentage(event.capacity, event.current_attendees)
  const spotsLeft = event.capacity ? event.capacity - event.current_attendees : null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in duration-200" />

        {/* Content — flex column, capped height, proper scroll */}
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md focus:outline-none">
          <div className="relative flex flex-col bg-card border border-border/60 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">

            {/* Close button */}
            <DialogPrimitive.Close className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            <AnimatePresence mode="wait" initial={false}>

              {/* ── Step 1: Event Details ── */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col min-h-0"
                >
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
                    <h2 className="text-lg font-semibold pr-8">Confirm Registration</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Review event details before continuing</p>
                  </div>

                  {/* Scrollable body */}
                  <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                    {/* Event summary */}
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{event.title}</h3>
                        <Badge className={cn('border shrink-0 text-xs', statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatDateTime(event.start_date)}</span>
                        </div>
                        {(event.venue?.name || event.city) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{event.venue?.name ?? event.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {event.current_attendees} attending
                            {spotsLeft !== null && spotsLeft <= 10 && (
                              <span className="text-orange-400 font-medium"> · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                            )}
                          </span>
                        </div>
                      </div>
                      {event.capacity && (
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full', capacityPct > 80 ? 'bg-orange-500' : 'bg-primary')} style={{ width: `${capacityPct}%` }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold">
                          {event.is_free ? <span className="text-green-400">Free</span> : formatCurrency(event.price, event.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Registering as */}
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Registering as</p>
                      <p className="text-sm font-medium">{profile?.full_name ?? user?.name ?? 'You'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {/* Footer — always visible */}
                  <div className="px-6 py-4 border-t border-border/40 flex gap-2 shrink-0 bg-card">
                    <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                    <Button className="flex-1" onClick={() => setStep('form')}>Continue →</Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Attendee Form ── */}
              {step === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col min-h-0"
                >
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
                    <h2 className="text-lg font-semibold pr-8">Your Details</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Contact info for your ticket & reminders</p>
                  </div>

                  {/* Scrollable form body */}
                  <div className="px-6 py-4 overflow-y-auto flex-1">
                    <form id="attendee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      {submitError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {submitError}
                        </div>
                      )}

                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...register('email')}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        <p className="text-xs text-muted-foreground">Your ticket confirmation will be sent here</p>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Phone Number <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          autoComplete="tel"
                          {...register('phone')}
                        />
                        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                        <p className="text-xs text-muted-foreground">For mobile reminders</p>
                      </div>

                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="name">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Alex Johnson"
                          autoComplete="name"
                          {...register('name')}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-border/40" />
                        <span className="text-xs text-muted-foreground">Optional</span>
                        <div className="flex-1 h-px bg-border/40" />
                      </div>

                      {/* Dietary */}
                      <div className="space-y-1.5">
                        <Label htmlFor="dietary">Dietary Requirements</Label>
                        <Input id="dietary" placeholder="Vegetarian, vegan, gluten-free…" {...register('dietaryRequirements')} />
                      </div>

                      {/* Emergency contact */}
                      <div className="space-y-1.5">
                        <Label htmlFor="emergency">Emergency Contact</Label>
                        <Input id="emergency" placeholder="Name — +91 98765 43210" {...register('emergencyContact')} />
                      </div>

                      {/* Special requests */}
                      <div className="space-y-1.5">
                        <Label htmlFor="requests">Special Requests</Label>
                        <Textarea
                          id="requests"
                          placeholder="Anything the organizer should know…"
                          rows={2}
                          className="resize-none"
                          {...register('specialRequests')}
                        />
                        {errors.specialRequests && <p className="text-xs text-destructive">{errors.specialRequests.message}</p>}
                      </div>
                    </form>
                  </div>

                  {/* Footer — always visible */}
                  <div className="px-6 py-4 border-t border-border/40 flex gap-2 shrink-0 bg-card">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('details')} disabled={isLoading}>
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      form="attendee-form"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering…</>
                        : 'Confirm Registration'
                      }
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Success ── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <div className="px-6 py-8 text-center space-y-4">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                      className={cn(
                        'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
                        regStatus === 'confirmed' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                      )}
                    >
                      {regStatus === 'confirmed'
                        ? <CheckCircle2 className="h-8 w-8 text-green-400" />
                        : <Clock className="h-8 w-8 text-yellow-400" />}
                    </motion.div>

                    <div>
                      <h2 className="text-xl font-bold">
                        {regStatus === 'confirmed' ? "You're in! 🎉" : "You're on the list!"}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {regStatus === 'confirmed'
                          ? 'Confirmation sent to your email.'
                          : "We'll notify you by email when a spot opens up."}
                      </p>
                    </div>

                    {ticketCode && regStatus === 'confirmed' && (
                      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Your Ticket Code</p>
                        <p className="text-2xl font-bold tracking-[0.2em] text-primary">{ticketCode}</p>
                        <p className="text-xs text-muted-foreground mt-1">Show this at the event entrance</p>
                      </div>
                    )}

                    <div className="rounded-lg bg-muted/40 p-3 text-left text-xs space-y-1 text-muted-foreground">
                      <p className="font-medium text-foreground text-sm">{event.title}</p>
                      <p>{formatDateTime(event.start_date)}</p>
                      {(event.venue?.name || event.city) && <p>📍 {event.venue?.name ?? event.city}</p>}
                    </div>
                  </div>

                  <div className="px-6 pb-6 shrink-0">
                    <Button className="w-full" onClick={handleClose}>Done</Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
