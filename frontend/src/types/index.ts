export * from './database'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface EventFilters {
  category?: string[]
  dateFrom?: string
  dateTo?: string
  distance?: number
  latitude?: number
  longitude?: number
  isFree?: boolean
  status?: string[]
  search?: string
  sortBy?: 'date' | 'popularity' | 'distance' | 'newest'
  page?: number
  pageSize?: number
}

export interface MapMarker {
  id: string
  latitude: number
  longitude: number
  title: string
  category: string
  status: string
  attendees: number
  thumbnailUrl?: string
}

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
  city?: string
  country?: string
}

export interface AnalyticsData {
  totalEvents: number
  totalRegistrations: number
  totalRevenue: number
  averageAttendance: number
  registrationsByDay: { date: string; count: number }[]
  topEvents: { id: string; title: string; registrations: number }[]
}
