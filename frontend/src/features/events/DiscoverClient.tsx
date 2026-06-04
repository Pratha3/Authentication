'use client'
import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Loader2, SearchX, Plus, Users } from 'lucide-react'
import { useEventsStore } from '@/store/events.store'
import { useEvents } from '@/hooks/useEvents'
import { useLocation } from '@/hooks/useLocation'
import { EventCard } from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton'
import { EventFilters } from '@/components/events/EventFilters'
import { SearchBar } from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { cn, formatDateTime } from '@/lib/utils'
import type { Event } from '@/types'

function getMapPosition(event: Event, index: number, total: number) {
  if (event.latitude != null && event.longitude != null) {
    const left = ((event.longitude + 180) / 360) * 100
    const top = ((90 - event.latitude) / 180) * 100
    return {
      left: `${Math.min(92, Math.max(8, left))}%`,
      top: `${Math.min(82, Math.max(12, top))}%`,
    }
  }

  const angle = (index / Math.max(total, 1)) * Math.PI * 2
  return {
    left: `${50 + Math.cos(angle) * 32}%`,
    top: `${48 + Math.sin(angle) * 28}%`,
  }
}

export function DiscoverClient() {
  const { events, isLoading, hasMore, loadEvents, loadMore } = useEvents()
  const { filters, mapView } = useEventsStore()
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

      {/* Results */}
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
      ) : mapView ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto lg:pr-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={ROUTES.EVENT(event.slug)}
                className="block rounded-lg border border-border/50 bg-card/70 p-4 transition-colors hover:border-primary/50 hover:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-1 text-sm font-semibold">{event.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{formatDateTime(event.start_date)}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{event.city || event.venue?.name || 'Location TBD'}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {event.is_free ? 'Free' : event.currency}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="relative min-h-[440px] overflow-hidden rounded-xl border border-border/50 bg-card/60">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
              aria-hidden="true"
            />
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-border/50 bg-background/85 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <p className="font-semibold">Map View</p>
              <p className="text-muted-foreground">{events.length} event{events.length === 1 ? '' : 's'} shown</p>
            </div>

            {events.map((event, index) => {
              const position = getMapPosition(event, index, events.length)
              return (
                <Link
                  key={event.id}
                  href={ROUTES.EVENT(event.slug)}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={position}
                  aria-label={`Open ${event.title}`}
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/15 transition-transform group-hover:scale-110">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={cn(
                      'pointer-events-none absolute left-1/2 top-12 hidden w-48 -translate-x-1/2 rounded-md border border-border/60 bg-background/95 p-2 text-xs shadow-xl backdrop-blur group-hover:block'
                    )}
                  >
                    <span className="line-clamp-1 font-semibold">{event.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {event.current_attendees} attending
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event: Event, i: number) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className={cn('flex justify-center py-4', mapView && 'hidden')}>
        {isLoading && events.length > 0 && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        {!hasMore && events.length > 0 && <p className="text-sm text-muted-foreground">You&apos;ve seen all events</p>}
      </div>
    </main>
  )
}
