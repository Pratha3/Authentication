import { create } from 'zustand'
import type { Event, EventFilters, UserLocation } from '@/types'

interface EventsState {
  events: Event[]
  featuredEvents: Event[]
  selectedEvent: Event | null
  filters: EventFilters
  userLocation: UserLocation | null
  isLoadingEvents: boolean
  hasMore: boolean
  page: number
  totalCount: number
  mapView: boolean

  setEvents: (events: Event[]) => void
  upsertEvent: (event: Event) => void
  appendEvents: (events: Event[]) => void
  setFeaturedEvents: (events: Event[]) => void
  setSelectedEvent: (event: Event | null) => void
  setFilters: (filters: Partial<EventFilters>) => void
  resetFilters: () => void
  setUserLocation: (location: UserLocation | null) => void
  setLoadingEvents: (loading: boolean) => void
  setHasMore: (hasMore: boolean) => void
  setPage: (page: number) => void
  setTotalCount: (count: number) => void
  setMapView: (mapView: boolean) => void
  updateEventAttendees: (eventId: string, count: number) => void
  updateEventStatus: (eventId: string, status: Event['status']) => void
}

const defaultFilters: EventFilters = {
  sortBy: 'date',
  page: 1,
  pageSize: 12,
}

export const useEventsStore = create<EventsState>()((set) => ({
  events: [],
  featuredEvents: [],
  selectedEvent: null,
  filters: defaultFilters,
  userLocation: null,
  isLoadingEvents: false,
  hasMore: true,
  page: 1,
  totalCount: 0,
  mapView: false,

  setEvents: (events) => set({ events }),
  upsertEvent: (event) =>
    set((state) => {
      const exists = state.events.some((item) => item.id === event.id)
      const shouldShowOnHome = ['upcoming', 'live'].includes(event.status)
      const featuredEvents = shouldShowOnHome
        ? [event, ...state.featuredEvents.filter((item) => item.id !== event.id)].slice(0, 6)
        : state.featuredEvents.filter((item) => item.id !== event.id)

      return {
        events: exists
          ? state.events.map((item) => (item.id === event.id ? event : item))
          : [event, ...state.events],
        featuredEvents,
      }
    }),
  appendEvents: (events) =>
    set((state) => ({
      events: [
        ...state.events,
        ...events.filter((event) => !state.events.some((item) => item.id === event.id)),
      ],
    })),
  setFeaturedEvents: (featuredEvents) => set({ featuredEvents }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      page: 1,
      events: [],
    })),

  resetFilters: () => set({ filters: defaultFilters, page: 1, events: [] }),

  setUserLocation: (userLocation) => set({ userLocation }),
  setLoadingEvents: (isLoadingEvents) => set({ isLoadingEvents }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setMapView: (mapView) => set({ mapView }),

  updateEventAttendees: (eventId, count) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, current_attendees: count } : e
      ),
      selectedEvent:
        state.selectedEvent?.id === eventId
          ? { ...state.selectedEvent, current_attendees: count }
          : state.selectedEvent,
    })),

  updateEventStatus: (eventId, status) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, status } : e)),
      selectedEvent:
        state.selectedEvent?.id === eventId
          ? { ...state.selectedEvent, status }
          : state.selectedEvent,
    })),
}))
