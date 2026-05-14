export type UserRole = 'user' | 'organizer' | 'admin'
export type EventStatus = 'draft' | 'upcoming' | 'live' | 'completed' | 'cancelled'
export type EventCategory =
  | 'marathon'
  | 'meetup'
  | 'cafe'
  | 'club'
  | 'community'
  | 'music'
  | 'sports'
  | 'tech'
  | 'food'
  | 'art'
  | 'wellness'
  | 'business'
  | 'outdoor'
  | 'workshop'
  | 'charity'
  | 'other'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  bio: string | null
  phone: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  interests: EventCategory[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Organizer {
  id: string
  user_id: string
  organization_name: string
  description: string | null
  logo_url: string | null
  website: string | null
  social_links: Record<string, string> | null
  verification_status: VerificationStatus
  verified_at: string | null
  total_events: number
  follower_count: number
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Venue {
  id: string
  organizer_id: string | null
  name: string
  address: string
  city: string
  state: string | null
  country: string
  zip_code: string | null
  latitude: number
  longitude: number
  capacity: number | null
  description: string | null
  amenities: string[]
  images: string[]
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organizer_id: string
  venue_id: string | null
  title: string
  slug: string
  description: string
  short_description: string | null
  banner_url: string | null
  category: EventCategory
  tags: string[]
  status: EventStatus
  start_date: string
  end_date: string
  timezone: string
  is_online: boolean
  online_url: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  capacity: number | null
  current_attendees: number
  price: number
  currency: string
  is_free: boolean
  registration_deadline: string | null
  min_age: number | null
  max_age: number | null
  requirements: string | null
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
  organizer?: Organizer
  venue?: Venue
  registrations?: Registration[]
  images?: EventImage[]
  is_registered?: boolean
  is_bookmarked?: boolean
  distance?: number
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  ticket_code: string
  registered_at: string
  cancelled_at: string | null
  event?: Event
  profile?: Profile
}

export interface Bookmark {
  id: string
  user_id: string
  event_id: string
  created_at: string
  event?: Event
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'event_update' | 'registration' | 'reminder' | 'system' | 'organizer'
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface EventImage {
  id: string
  event_id: string
  url: string
  alt_text: string | null
  order_index: number
  created_at: string
}

export interface UserInterest {
  id: string
  user_id: string
  category: EventCategory
  created_at: string
}

export interface OrganizerVerificationRequest {
  id: string
  organizer_id: string
  submitted_by: string
  documents: string[]
  notes: string | null
  status: VerificationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  organizer?: Organizer
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      organizers: { Row: Organizer; Insert: Omit<Organizer, 'id' | 'created_at' | 'updated_at' | 'total_events' | 'follower_count'>; Update: Partial<Organizer> }
      venues: { Row: Venue; Insert: Omit<Venue, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Venue> }
      events: { Row: Event; Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'current_attendees' | 'view_count'>; Update: Partial<Event> }
      registrations: { Row: Registration; Insert: Omit<Registration, 'id' | 'registered_at'>; Update: Partial<Registration> }
      bookmarks: { Row: Bookmark; Insert: Omit<Bookmark, 'id' | 'created_at'>; Update: Partial<Bookmark> }
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> }
      event_images: { Row: EventImage; Insert: Omit<EventImage, 'id' | 'created_at'>; Update: Partial<EventImage> }
      user_interests: { Row: UserInterest; Insert: Omit<UserInterest, 'id' | 'created_at'>; Update: Partial<UserInterest> }
      organizer_verification_requests: { Row: OrganizerVerificationRequest; Insert: Omit<OrganizerVerificationRequest, 'id' | 'created_at'>; Update: Partial<OrganizerVerificationRequest> }
    }
  }
}
