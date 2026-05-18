'use client'
import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Loader2, SearchX, Plus } from 'lucide-react'
import { useEventsStore } from '@/store/events.store'
import { useEvents } from '@/hooks/useEvents'
import { useLocation } from '@/hooks/useLocation'
import { EventCard } from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton'
import { EventFilters } from '@/components/events/EventFilters'
import { SearchBar } from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import type { Event } from '@/types'

export function DiscoverClient() {
  const { events, isLoading, hasMore, loadEvents, loadMore } = useEvents()
  const { filters } = useEventsStore()
  const { detectLocation, isDetecting, userLocation } = useLocation()
  const loaderRef = useRef<HTMLDivElement>(null)

  const hasActiveFilters = Boolean(
    filters.category?.length ||
    filters.dateFrom || filters.dateTo ||
    filters.isFree !== undefined ||
    filters.latitude || filters.longitude ||
    filters.distance || filters.search
  )

  // Initial load + reload on filter changes
  useEffect(() => {
    loadEvents(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.dateFrom, filters.dateTo, filters.isFree, filters.distance, filters.latitude, filters.longitude, filters.sortBy, filters.search])

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) loadMore()
  }, [hasMore, isLoading, loadMore])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  const isEmpty = !isLoading && events.length === 0

  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {userLocation ? 'Showing events near your location' : 'Browse events everywhere'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={detectLocation} disabled={isDetecting} className="gap-2 shrink-0">
          {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {userLocation ? 'Update Location' : 'Use My Location'}
        </Button>
      </div>

      <SearchBar />
      <EventFilters />

      {/* Grid */}
      {isLoading && events.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : isEmpty ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center">
          <SearchX className="h-14 w-14 text-muted-foreground/40 mb-4" />
          {hasActiveFilters ? (
            <>
              <h3 className="text-lg font-semibold">No events match your filters</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">Try adjusting your filters or broadening your search.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold">No events yet</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">Be the first to create an event in your community!</p>
              <Button asChild className="mt-4 gap-2">
                <Link href={ROUTES.ORGANIZER.CREATE}><Plus className="h-4 w-4" />Create Event</Link>
              </Button>
            </>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event: Event, i: number) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoading && events.length > 0 && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        {!hasMore && events.length > 0 && <p className="text-sm text-muted-foreground">You&apos;ve seen all events</p>}
      </div>
    </main>
  )
}
