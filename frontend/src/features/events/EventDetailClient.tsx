'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Users, Share2, Bookmark, BookmarkCheck,
  Clock, Tag, Loader2, AlertCircle, CheckCircle2, ExternalLink,
  Ticket, LayoutDashboard,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchEventBySlug } from '@/services/api/events.service'
import { cancelRegistration } from '@/services/api/registrations.service'
import { useAuthStore } from '@/store/auth.store'
import { useBookmark } from '@/hooks/useBookmark'
import { useRealtimeEvent } from '@/hooks/useRealtimeEvent'
import { useEventsStore } from '@/store/events.store'
import { RegistrationModal } from '@/components/events/RegistrationModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EVENT_CATEGORIES, EVENT_STATUS_CONFIG, ROUTES } from '@/constants'
import { cn, formatDateTime, formatDate, formatCurrency, getCapacityPercentage } from '@/lib/utils'
import type { Event } from '@/types'
import { EventChat } from '@/components/events/EventChat'
import { ReviewSection } from '@/components/events/ReviewSection'

interface Props { slug: string }

function RealtimeEventWrapper({ eventId }: { eventId: string }) {
  useRealtimeEvent(eventId)
  return null
}

export function EventDetailClient({ slug }: Props) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const { user, profile } = useAuthStore()
  const { selectedEvent, setSelectedEvent } = useEventsStore()

  useEffect(() => {
    setIsLoading(true)
    fetchEventBySlug(slug, user?.id).then(({ data }) => {
      setEvent(data)
      if (data) setSelectedEvent(data)
      setIsLoading(false)
    })
  }, [slug, user?.id, setSelectedEvent])

  // Sync real-time count/status from store
  useEffect(() => {
    if (selectedEvent?.slug === slug && event?.id === selectedEvent.id) {
      setEvent(prev => prev ? {
        ...prev,
        current_attendees: selectedEvent.current_attendees,
        status: selectedEvent.status,
      } : prev)
    }
  }, [selectedEvent, slug, event?.id])

  const { bookmarked, toggleBookmark } = useBookmark(event?.id ?? '', !!event?.is_bookmarked)

  // Check if current user is the organizer of this event.
  // More reliable: compare the organizer's userId stored in the event
  const [isOrganizer, setIsOrganizer] = useState(false)
  useEffect(() => {
    if (!event || !user) { setIsOrganizer(false); return }
    let ignore = false

    // The backend populates organizerId with organizationName — we also get
    // the raw organizer_id. We compare via the profile endpoint lazily.
    const orgObj = event.organizer as any
    if (orgObj?.user_id === user.id) { setIsOrganizer(true); return }

    setIsOrganizer(false)

    // Check via profile role + whether user has an organizer that owns this event
    if (profile?.role === 'organizer' || profile?.role === 'admin') {
      // Fetch organizer profile to get the _id, then compare with event.organizer_id
      import('@/services/api/profiles.service').then(({ fetchOrganizerProfile }) => {
        fetchOrganizerProfile(user.id).then(({ data: org }) => {
          if (!ignore) setIsOrganizer(!!org && org.id === event.organizer_id)
        })
      })
    }

    return () => { ignore = true }
  }, [event, user, profile])

  const handleRegistrationSuccess = (updates: Partial<Event>) => {
    setEvent(prev => prev ? { ...prev, ...updates } : prev)
    setRegistrationModalOpen(false)
  }

  const handleCancel = async () => {
    if (!user || !event) return
    if (!confirm('Cancel your registration for this event?')) return
    setIsCancelling(true)
    const { error } = await cancelRegistration(event.id, user.id)
    if (error) {
      toast.error(error)
    } else {
      setEvent(prev => prev ? {
        ...prev,
        is_registered: false,
        current_attendees: Math.max(0, (prev.current_attendees ?? 1) - 1),
      } : prev)
      toast.success('Registration cancelled')
    }
    setIsCancelling(false)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: event?.title ?? '', url })
    else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Event not found</h2>
        <p className="text-muted-foreground mt-2">This event may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  const categoryConfig = EVENT_CATEGORIES.find(c => c.value === event.category)
  const statusConfig = EVENT_STATUS_CONFIG[event.status]
  const capacityPct = getCapacityPercentage(event.capacity, event.current_attendees)
  const isFull = event.capacity !== null && event.current_attendees >= event.capacity
  const isClosed = ['completed', 'cancelled'].includes(event.status)
  const registrationDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false
  const canRegister = !isClosed && !registrationDeadlinePassed

  return (
    <main className="container py-6 pb-24 lg:pb-8 max-w-5xl">
      {event.id && <RealtimeEventWrapper eventId={event.id} />}

      <RegistrationModal
        event={event}
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Banner */}
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-muted">
          {event.banner_url ? (
            <Image src={event.banner_url} alt={event.title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 1024px" />
          ) : (
            <div className={cn('flex h-full items-center justify-center text-7xl', categoryConfig?.color)}>
              {categoryConfig?.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className={cn('border', statusConfig.color)}>{statusConfig.label}</Badge>
            {event.is_featured && <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">⭐ Featured</Badge>}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant="outline" className={cn('border mb-3', categoryConfig?.color)}>
                {categoryConfig?.emoji} {categoryConfig?.label}
              </Badge>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              {event.organizer && (
                <p className="text-muted-foreground mt-2">
                  by <span className="text-foreground font-medium">{event.organizer.organization_name}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Calendar, label: 'Starts', value: formatDateTime(event.start_date) },
                { icon: Clock, label: 'Ends', value: formatDateTime(event.end_date) },
                ...((event.venue?.name || event.city) ? [{ icon: MapPin, label: 'Location', value: event.venue?.name ?? event.city ?? '' }] : []),
                { icon: Users, label: 'Attendees', value: `${event.current_attendees}${event.capacity ? ` / ${event.capacity}` : ''} going` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2">About this event</h3>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">{event.description}</p>
            </div>

            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                {event.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-border/20">
              <ReviewSection
                eventId={event.id}
                isAttendee={!!event.is_registered}
                isCompleted={isClosed || new Date(event.start_date) < new Date()}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 sticky top-20">
              <div className="text-center">
                {event.is_free
                  ? <span className="text-2xl font-bold text-green-400">Free</span>
                  : <span className="text-2xl font-bold">{formatCurrency(event.price, event.currency)}</span>
                }
                <p className="text-xs text-muted-foreground mt-1">per person</p>
              </div>

              {event.capacity && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{event.current_attendees} registered</span>
                    <span>{Math.max(0, event.capacity - event.current_attendees)} spots left</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', capacityPct > 80 ? 'bg-orange-500' : 'bg-primary')}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                  {isFull && <p className="text-xs text-center text-destructive font-medium">Event is full</p>}
                </div>
              )}

              {/* ── CTA section ── */}
              {isOrganizer ? (
                /* Organizer sees manage button, NOT register */
                <div className="space-y-2">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                    <p className="text-xs text-primary font-medium">You are the organizer</p>
                  </div>
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link href={ROUTES.ORGANIZER.DASHBOARD}>
                      <LayoutDashboard className="h-4 w-4" />
                      Manage Event
                    </Link>
                  </Button>
                </div>
              ) : event.is_registered ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-center text-green-400 text-sm font-medium py-1">
                    <CheckCircle2 className="h-4 w-4" />
                    You&apos;re registered!
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Ticket className="h-3.5 w-3.5" />
                      Check your email for your ticket
                    </div>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="w-full text-destructive hover:text-destructive border-destructive/30"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Registration'}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      toast.error('Please sign in to register', {
                        action: { label: 'Sign in', onClick: () => router.push(ROUTES.LOGIN) },
                      })
                      return
                    }
                    setRegistrationModalOpen(true)
                  }}
                  disabled={!canRegister}
                >
                  {isClosed || registrationDeadlinePassed ? 'Registration Closed'
                    : isFull ? 'Join Waitlist'
                    : event.is_free ? 'Register for Free'
                    : 'Register Now'}
                </Button>
              )}

              {event.registration_deadline && (
                <p className="text-xs text-muted-foreground text-center">
                  {registrationDeadlinePassed ? 'Registration is closed' : `Registration closes ${formatDate(event.registration_deadline)}`}
                </p>
              )}

              {(event.is_registered || isOrganizer) && !isClosed && (
                <div className="pt-1">
                  <EventChat eventId={event.id} eventTitle={event.title} />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={toggleBookmark}>
                  {bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                  {bookmarked ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {event.is_online && event.online_url && (
                <a href={event.online_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 text-xs text-primary hover:underline justify-center">
                  <ExternalLink className="h-3 w-3" /> Join Online Event
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sticky CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border/50 px-4 py-3.5 flex items-center justify-between shadow-2xl safe-bottom animate-in fade-in slide-in-from-bottom-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-extrabold text-foreground">
            {event.is_free ? <span className="text-green-400">Free</span> : formatCurrency(event.price, event.currency)}
          </span>
          {event.capacity && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {Math.max(0, event.capacity - event.current_attendees)} spots left
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOrganizer ? (
            <Button asChild size="sm" className="gap-1.5 shadow-md shadow-primary/10 hover:shadow-glow-primary font-semibold">
              <Link href={ROUTES.ORGANIZER.DASHBOARD}>
                <LayoutDashboard className="h-3.5 w-3.5" />
                Manage
              </Link>
            </Button>
          ) : event.is_registered ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-green-400 font-semibold mr-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Registered
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30 h-8 text-xs px-2.5"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="px-5 shadow-lg shadow-primary/20 hover:shadow-glow-primary font-bold"
              onClick={() => {
                if (!user) {
                  toast.error('Please sign in to register', {
                    action: { label: 'Sign in', onClick: () => router.push(ROUTES.LOGIN) },
                  })
                  return
                }
                setRegistrationModalOpen(true)
              }}
              disabled={!canRegister}
            >
              {isClosed || registrationDeadlinePassed ? 'Closed'
                : isFull ? 'Join Waitlist'
                : event.is_free ? 'Register Free'
                : 'Register Now'}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
