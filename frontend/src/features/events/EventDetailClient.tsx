'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Users, Share2, Bookmark, BookmarkCheck,
  Clock, Tag, Loader2, AlertCircle, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchEventBySlug } from '@/services/api/events.service'
import { registerForEvent, cancelRegistration } from '@/services/api/registrations.service'
import { useAuthStore } from '@/store/auth.store'
import { useBookmark } from '@/hooks/useBookmark'
import { useRealtimeEvent } from '@/hooks/useRealtimeEvent'
import { useEventsStore } from '@/store/events.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EVENT_CATEGORIES, EVENT_STATUS_CONFIG } from '@/constants'
import { cn, formatDateTime, formatDate, formatCurrency, getCapacityPercentage } from '@/lib/utils'
import type { Event } from '@/types'

interface Props { slug: string }

function RealtimeEventWrapper({ eventId }: { eventId: string }) {
  useRealtimeEvent(eventId)
  return null
}

export function EventDetailClient({ slug }: Props) {
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const { user } = useAuthStore()
  const { selectedEvent, setSelectedEvent } = useEventsStore()

  useEffect(() => {
    setIsLoading(true)
    fetchEventBySlug(slug, user?.id).then(({ data }) => {
      setEvent(data)
      if (data) setSelectedEvent(data)
      setIsLoading(false)
    })
  }, [slug, user?.id, setSelectedEvent])

  // Sync real-time updates back to local state
  useEffect(() => {
    if (selectedEvent?.slug === slug && event?.id === selectedEvent.id) {
      setEvent(selectedEvent)
    }
  }, [selectedEvent, slug, event?.id])

  const { bookmarked, toggleBookmark } = useBookmark(event?.id ?? '')

  const handleRegister = async () => {
    if (!user || !event) { toast.error('Sign in to register'); return }
    setIsRegistering(true)
    if (event.is_registered) {
      const { error } = await cancelRegistration(event.id, user.id)
      if (error) toast.error(error)
      else { setEvent(prev => prev ? { ...prev, is_registered: false } : prev); toast.success('Registration cancelled') }
    } else {
      const { error } = await registerForEvent(event.id, user.id)
      if (error) toast.error(error)
      else { setEvent(prev => prev ? { ...prev, is_registered: true } : prev); toast.success('Registered successfully! 🎉') }
    }
    setIsRegistering(false)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: event?.title ?? '', url })
    } else {
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
  const canRegister = !['completed', 'cancelled'].includes(event.status) && !isFull

  return (
    <main className="container py-6 max-w-5xl">
      {event.id && <RealtimeEventWrapper eventId={event.id} />}

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
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={cn('border', categoryConfig?.color)}>
                  {categoryConfig?.emoji} {categoryConfig?.label}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              {event.organizer && (
                <p className="text-muted-foreground mt-2">
                  by <span className="text-foreground font-medium">{event.organizer.organization_name}</span>
                </p>
              )}
            </div>

            {/* Meta grid */}
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

            {/* Description */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-base font-semibold mb-2">About this event</h3>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {event.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — Registration */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 sticky top-20">
              {/* Price */}
              <div className="text-center">
                {event.is_free ? (
                  <span className="text-2xl font-bold text-green-400">Free</span>
                ) : (
                  <span className="text-2xl font-bold">{formatCurrency(event.price, event.currency)}</span>
                )}
                <p className="text-xs text-muted-foreground mt-1">per person</p>
              </div>

              {/* Capacity bar */}
              {event.capacity && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{event.current_attendees} registered</span>
                    <span>{event.capacity - event.current_attendees} spots left</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', capacityPct > 80 ? 'bg-orange-500' : 'bg-primary')}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                  {isFull && <p className="text-xs text-center text-destructive font-medium">Event is full</p>}
                </div>
              )}

              {/* Register CTA */}
              {event.is_registered ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-center text-green-400 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    You&apos;re registered!
                  </div>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleRegister} disabled={isRegistering}>
                    {isRegistering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Registration'}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleRegister}
                  disabled={isRegistering || !canRegister}
                >
                  {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {!canRegister ? 'Registration Closed' : event.is_free ? 'Register for Free' : 'Register Now'}
                </Button>
              )}

              {event.registration_deadline && (
                <p className="text-xs text-muted-foreground text-center">
                  Registration closes {formatDate(event.registration_deadline)}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={toggleBookmark}>
                  {bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                  {bookmarked ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {event.is_online && event.online_url && (
                <a href={event.online_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline justify-center">
                  <ExternalLink className="h-3 w-3" /> Join Online Event
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
