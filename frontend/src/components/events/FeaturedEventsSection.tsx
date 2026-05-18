'use client'
import { useFeaturedEvents } from '@/hooks/useEvents'
import { EventCard } from './EventCard'
import { EventCardSkeleton } from './EventCardSkeleton'
import { sampleEvents } from '@/constants/sampleEvents'

export function FeaturedEventsSection() {
  const events = useFeaturedEvents()
  const displayEvents = events.length ? events : sampleEvents

  if (!displayEvents.length) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {displayEvents.map((event, i) => (
        <EventCard key={event.id} event={event} index={i} />
      ))}
    </div>
  )
}
