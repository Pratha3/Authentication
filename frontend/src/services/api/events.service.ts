import { eventsApi } from '@/lib/api'
import type { Event, EventFilters, ApiResponse, PaginatedResponse } from '@/types'
import { ITEMS_PER_PAGE } from '@/constants'
import { sampleEvents } from '@/constants/sampleEvents'

export type EventPayload = {
  title: string
  description: string
  shortDescription: string | null
  category: string
  startDate: string
  endDate: string
  city: string | null
  address: string | null
  isOnline: boolean
  onlineUrl: string | null
  isFree: boolean
  price: number
  capacity: number | null
  tags: string[]
  bannerUrl: string | null
  slug: string
  status: Event['status']
  isFeatured: boolean
  currency: string
  timezone: string
}

export async function fetchEvents(
  filters: EventFilters = {},
  userId?: string
): Promise<PaginatedResponse<Event>> {
  const {
    category, dateFrom, dateTo, isFree,
    status = ['upcoming', 'live'],
    search, sortBy = 'date',
    page = 1, pageSize = ITEMS_PER_PAGE,
    latitude, longitude, distance,
  } = filters

  const params: Record<string, string | number | boolean | string[] | undefined> = {
    status: Array.isArray(status) ? status.join(',') : status,
    sortBy,
    page,
    pageSize,
  }

  if (category?.length) params.category = category.join(',')
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo
  if (isFree !== undefined) params.isFree = isFree
  if (search) params.search = search
  if (latitude) params.latitude = latitude
  if (longitude) params.longitude = longitude
  if (distance) params.distance = distance
  if (userId) params.userId = userId

  const hasActiveFilters = Boolean(category?.length || dateFrom || dateTo || isFree !== undefined || search)

  try {
    const res = await eventsApi.list(params)
    const result = res as PaginatedResponse<Event>
    if (result.data.length === 0 && page === 1 && !hasActiveFilters) {
      return { data: sampleEvents, count: sampleEvents.length, page, pageSize, hasMore: false }
    }
    return result
  } catch {
    const data = page === 1 && !hasActiveFilters ? sampleEvents : []
    return { data, count: data.length, page, pageSize, hasMore: false }
  }
}

export async function fetchEventBySlug(slug: string, _userId?: string): Promise<ApiResponse<Event>> {
  try {
    const res = await eventsApi.bySlug(slug)
    return { data: res.data as Event, error: res.error }
  } catch (err: unknown) {
    const sample = sampleEvents.find((event) => event.slug === slug)
    if (sample) return { data: sample, error: null }
    return { data: null, error: err instanceof Error ? err.message : 'Event not found' }
  }
}

export async function fetchFeaturedEvents(): Promise<ApiResponse<Event[]>> {
  try {
    const res = await eventsApi.featured()
    const data = res.data as Event[]
    return { data: data.length ? data : sampleEvents, error: null }
  } catch (err: unknown) {
    return { data: sampleEvents, error: err instanceof Error ? err.message : 'Failed to fetch featured events' }
  }
}

export async function fetchNearbyEvents(
  latitude: number,
  longitude: number,
  radiusKm = 10
): Promise<ApiResponse<Event[]>> {
  try {
    const res = await eventsApi.nearby(latitude, longitude, radiusKm)
    return { data: res.data as Event[], error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch nearby events' }
  }
}

export async function createEvent(
  payload: EventPayload
): Promise<ApiResponse<Event>> {
  try {
    const res = await eventsApi.create(payload)
    return { data: res.data as Event, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create event' }
  }
}

export async function updateEvent(id: string, payload: Partial<EventPayload>): Promise<ApiResponse<Event>> {
  try {
    const res = await eventsApi.update(id, payload)
    return { data: res.data as Event, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update event' }
  }
}

export async function deleteEvent(id: string): Promise<ApiResponse<null>> {
  try {
    await eventsApi.delete(id)
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to delete event' }
  }
}

export async function fetchOrganizerEvents(organizerId: string): Promise<ApiResponse<Event[]>> {
  try {
    const res = await eventsApi.organizerEvents(organizerId)
    return { data: res.data as Event[], error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch organizer events' }
  }
}
