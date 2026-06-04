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
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory -mx-6 px-6 sm:-mx-8 sm:px-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[280px] sm:w-[350px] shrink-0 snap-start">
            <EventCardSkeleton />
          </div>
        ))}
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
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory -mx-6 px-6 sm:-mx-8 sm:px-8">
      {events.map((event, i) => (
        <div key={event.id} className="w-[280px] sm:w-[350px] shrink-0 snap-start">
          <EventCard event={event} index={i} />
        </div>
      ))}
    </div>
  )
}
