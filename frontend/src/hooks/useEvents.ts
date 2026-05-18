'use client'
import { useCallback, useEffect, useState } from 'react'
import { useEventsStore } from '@/store/events.store'
import { useAuthStore } from '@/store/auth.store'
import { fetchEvents, fetchFeaturedEvents } from '@/services/api/events.service'
import type { Event } from '@/types'

export function useEvents() {
  const {
    events, filters, isLoadingEvents, hasMore, page,
    setEvents, appendEvents, setLoadingEvents, setHasMore, setPage, setTotalCount,
  } = useEventsStore()
  const { user } = useAuthStore()

  const loadEvents = useCallback(async (reset = false) => {
    if (isLoadingEvents) return
    setLoadingEvents(true)
    const currentPage = reset ? 1 : page
    const result = await fetchEvents({ ...filters, page: currentPage }, user?.id)
    if (reset) setEvents(result.data)
    else appendEvents(result.data)
    setHasMore(result.hasMore)
    setTotalCount(result.count)
    setPage(currentPage + 1)
    setLoadingEvents(false)
  }, [filters, page, user?.id, isLoadingEvents, setEvents, appendEvents, setLoadingEvents, setHasMore, setTotalCount, setPage])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingEvents) return
    loadEvents(false)
  }, [hasMore, isLoadingEvents, loadEvents])

  return { events, isLoading: isLoadingEvents, hasMore, loadEvents, loadMore }
}

export function useFeaturedEvents(): { events: Event[]; isLoading: boolean } {
  const { featuredEvents, setFeaturedEvents } = useEventsStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetchFeaturedEvents().then(({ data }) => {
      if (data) setFeaturedEvents(data)
    }).finally(() => setIsLoading(false))
  }, [setFeaturedEvents])

  return { events: featuredEvents, isLoading }
}
