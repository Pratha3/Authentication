'use client'
import { useFeaturedEvents } from '@/hooks/useEvents'
import { EventCard } from './EventCard'
import { EventCardSkeleton } from './EventCardSkeleton'
import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

export function FeaturedEventsSection() {
  const { events, isLoading } = useFeaturedEvents()

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
      </div>
    )
  }

  if (!events.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 py-12 text-center">
        <Compass className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No events yet — be the first to create one!</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={ROUTES.ORGANIZER.CREATE}>Create Event</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, i) => (
        <EventCard key={event.id} event={event} index={i} />
      ))}
    </div>
  )
}
