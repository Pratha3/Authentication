import type { EventCategory } from '@/types'

export const APP_NAME = 'EventSphere'
export const APP_DESCRIPTION = 'Discover and join local events, meetups, marathons, and more'

export const EVENT_CATEGORIES: { value: EventCategory; label: string; emoji: string; color: string }[] = [
  { value: 'marathon', label: 'Marathon', emoji: '🏃', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'meetup', label: 'Meetup', emoji: '🤝', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'cafe', label: 'Café Event', emoji: '☕', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'club', label: 'Club', emoji: '🎶', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'community', label: 'Community', emoji: '🏘️', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'music', label: 'Music', emoji: '🎵', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'sports', label: 'Sports', emoji: '⚽', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'tech', label: 'Tech', emoji: '💻', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'food', label: 'Food', emoji: '🍕', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'art', label: 'Art', emoji: '🎨', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { value: 'wellness', label: 'Wellness', emoji: '🧘', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { value: 'business', label: 'Business', emoji: '💼', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌲', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'workshop', label: 'Workshop', emoji: '🔧', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'charity', label: 'Charity', emoji: '❤️', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { value: 'other', label: 'Other', emoji: '✨', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
]

export const EVENT_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  upcoming: { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  live: { label: 'Live Now', color: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
} as const

export const DISTANCE_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
]

export const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'distance', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
]

export const ITEMS_PER_PAGE = 12
export const MAP_DEFAULT_ZOOM = 12
export const MAP_DEFAULT_CENTER: [number, number] = [72.8777, 19.076] // Mumbai default

export const SUPABASE_BUCKETS = {
  EVENTS: 'event-images',
  AVATARS: 'avatars',
  ORGANIZERS: 'organizer-assets',
} as const

export const REALTIME_CHANNELS = {
  EVENTS: 'events',
  REGISTRATIONS: 'registrations',
  NOTIFICATIONS: 'notifications',
} as const

export const ROUTES = {
  HOME: '/',
  DISCOVER: '/discover',
  EVENT: (id: string) => `/events/${id}`,
  SEARCH: '/search',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ONBOARDING: '/onboarding',
  CALLBACK: '/callback',
  PROFILE: '/profile',
  BOOKMARKS: '/bookmarks',
  NOTIFICATIONS: '/notifications',
  REGISTERED: '/registered-events',
  ORGANIZER: {
    DASHBOARD: '/organizer/dashboard',
    CREATE: '/organizer/events/create',
    EDIT: (id: string) => `/organizer/events/${id}/edit`,
    ATTENDEES: (id: string) => `/organizer/attendees/${id}`,
  },
  ADMIN: '/admin',
} as const
