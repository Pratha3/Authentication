// ─── Central HTTP client for the Express/MongoDB backend ─────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthPayload {
  token: string
  user: AuthUser
  message: string
}

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
}

// ─── Normalize MongoDB _id / camelCase → frontend snake_case ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProfile(raw: any) {
  if (!raw) return null
  return {
    id: String(raw._id ?? raw.id ?? raw.userId ?? ''),
    email: raw.email ?? '',
    full_name: raw.fullName ?? raw.full_name ?? null,
    avatar_url: raw.avatarUrl ?? raw.avatar_url ?? null,
    role: raw.role ?? 'user',
    bio: raw.bio ?? null,
    phone: raw.phone ?? null,
    location: raw.location ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    interests: raw.interests ?? [],
    is_active: raw.isActive ?? raw.is_active ?? true,
    created_at: raw.createdAt ?? raw.created_at ?? '',
    updated_at: raw.updatedAt ?? raw.updated_at ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeEvent(raw: any) {
  if (!raw) return null
  const organizerId = raw.organizerId ?? raw.organizer_id
  const venueId = raw.venueId ?? raw.venue_id
  return {
    id: String(raw._id ?? raw.id ?? ''),
    organizer_id: organizerId && typeof organizerId === 'object' ? String(organizerId._id ?? organizerId.id ?? '') : String(organizerId ?? ''),
    venue_id: venueId ? (typeof venueId === 'object' ? String(venueId._id ?? venueId.id ?? '') : String(venueId)) : null,
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    description: raw.description ?? '',
    short_description: raw.shortDescription ?? raw.short_description ?? null,
    banner_url: raw.bannerUrl ?? raw.banner_url ?? null,
    category: raw.category ?? 'other',
    tags: raw.tags ?? [],
    status: raw.status ?? 'upcoming',
    start_date: raw.startDate ?? raw.start_date ?? '',
    end_date: raw.endDate ?? raw.end_date ?? '',
    timezone: raw.timezone ?? 'Asia/Kolkata',
    is_online: raw.isOnline ?? raw.is_online ?? false,
    online_url: raw.onlineUrl ?? raw.online_url ?? null,
    address: raw.address ?? null,
    city: raw.city ?? null,
    state: raw.state ?? null,
    country: raw.country ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    capacity: raw.capacity ?? null,
    current_attendees: raw.currentAttendees ?? raw.current_attendees ?? 0,
    price: raw.price ?? 0,
    currency: raw.currency ?? 'INR',
    is_free: raw.isFree ?? raw.is_free ?? true,
    registration_deadline: raw.registrationDeadline ?? raw.registration_deadline ?? null,
    min_age: raw.minAge ?? raw.min_age ?? null,
    max_age: raw.maxAge ?? raw.max_age ?? null,
    requirements: raw.requirements ?? null,
    is_featured: raw.isFeatured ?? raw.is_featured ?? false,
    view_count: raw.viewCount ?? raw.view_count ?? 0,
    created_at: raw.createdAt ?? raw.created_at ?? '',
    updated_at: raw.updatedAt ?? raw.updated_at ?? '',
    organizer: raw.organizerId && typeof raw.organizerId === 'object' ? {
      id: String(raw.organizerId._id ?? raw.organizerId),
      organization_name: raw.organizerId.organizationName ?? '',
      logo_url: raw.organizerId.logoUrl ?? null,
      verification_status: raw.organizerId.verificationStatus ?? 'pending',
    } : undefined,
    venue: raw.venueId && typeof raw.venueId === 'object' ? {
      id: String(raw.venueId._id ?? raw.venueId),
      name: raw.venueId.name ?? '',
      address: raw.venueId.address ?? '',
      city: raw.venueId.city ?? '',
      latitude: raw.venueId.latitude ?? null,
      longitude: raw.venueId.longitude ?? null,
    } : undefined,
    images: (raw.images ?? []).map((img: any) => ({
      id: String(img._id ?? img.id ?? ''),
      url: img.url ?? '',
      alt_text: img.altText ?? img.alt_text ?? null,
      order_index: img.orderIndex ?? img.order_index ?? 0,
    })),
    is_registered: raw.isRegistered ?? raw.is_registered ?? false,
    is_bookmarked: raw.isBookmarked ?? raw.is_bookmarked ?? false,
    distance: raw.distance ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAuthUser(raw: any): AuthUser {
  return { id: String(raw._id ?? raw.id ?? ''), email: raw.email ?? '', name: raw.name }
}

// ─── Core request helper ──────────────────────────────────────────────────────
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Something went wrong.')
  return data as T
}

// ─── Multipart upload helper ──────────────────────────────────────────────────
export async function uploadRequest(
  endpoint: string,
  formData: FormData
): Promise<{ url: string; error: string | null }> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, { method: 'POST', headers, body: formData })
  const data = await res.json()
  if (!res.ok) return { url: '', error: data.message || 'Upload failed.' }
  return data
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: async (email: string, password: string, name?: string): Promise<AuthPayload> => {
    const raw = await request<AuthPayload>('/auth/signup', {
      method: 'POST', body: JSON.stringify({ email, password, name }),
    })
    return { ...raw, user: normalizeAuthUser(raw.user) }
  },

  login: async (email: string, password: string): Promise<AuthPayload> => {
    const raw = await request<AuthPayload>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    return { ...raw, user: normalizeAuthUser(raw.user) }
  },

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>(`/auth/reset-password/${token}`, {
      method: 'POST', body: JSON.stringify({ password }),
    }),

  getMe: async () => {
    const raw = await request<{ user: AuthUser }>('/auth/me')
    return { user: normalizeAuthUser(raw.user) }
  },
}

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: async (params: Record<string, string | number | boolean | string[] | undefined> = {}) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.set(k, Array.isArray(v) ? v.join(',') : String(v))
    }
    const raw = await request<{ data: unknown[]; count: number; page: number; pageSize: number; hasMore: boolean }>(
      `/events?${qs.toString()}`
    )
    return { ...raw, data: raw.data.map(normalizeEvent) }
  },
  featured: async () => {
    const raw = await request<{ data: unknown[] }>('/events/featured')
    return { data: raw.data.map(normalizeEvent) }
  },
  nearby: async (lat: number, lon: number, radius?: number) => {
    const raw = await request<{ data: unknown[] }>(
      `/events/nearby?latitude=${lat}&longitude=${lon}${radius ? `&radius=${radius}` : ''}`
    )
    return { data: raw.data.map(normalizeEvent) }
  },
  bySlug: async (slug: string) => {
    const raw = await request<{ data: unknown; error: string | null }>(`/events/${slug}`)
    return { data: normalizeEvent(raw.data), error: raw.error }
  },
  organizerEvents: async (organizerId: string) => {
    const raw = await request<{ data: unknown[] }>(`/events/organizer/${organizerId}`)
    return { data: raw.data.map(normalizeEvent) }
  },
  create: async (payload: unknown) => {
    const raw = await request<{ data: unknown }>('/events', { method: 'POST', body: JSON.stringify(payload) })
    return { data: normalizeEvent(raw.data) }
  },
  update: async (id: string, payload: unknown) => {
    const raw = await request<{ data: unknown }>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return { data: normalizeEvent(raw.data) }
  },
  delete: (id: string) => request<{ data: null }>(`/events/${id}`, { method: 'DELETE' }),
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profilesApi = {
  get: async (userId: string) => {
    const raw = await request<{ data: unknown }>(`/profiles/${userId}`)
    return { data: normalizeProfile(raw.data) }
  },
  update: async (userId: string, payload: unknown) => {
    // Convert frontend snake_case back to MongoDB camelCase for the PATCH body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = payload as any
    const mongoPayload = {
      ...(p.full_name !== undefined && { fullName: p.full_name }),
      ...(p.avatar_url !== undefined && { avatarUrl: p.avatar_url }),
      ...(p.bio !== undefined && { bio: p.bio }),
      ...(p.phone !== undefined && { phone: p.phone }),
      ...(p.location !== undefined && { location: p.location }),
      ...(p.latitude !== undefined && { latitude: p.latitude }),
      ...(p.longitude !== undefined && { longitude: p.longitude }),
      ...(p.interests !== undefined && { interests: p.interests }),
      ...(p.is_active !== undefined && { isActive: p.is_active }),
    }
    const raw = await request<{ data: unknown }>(`/profiles/${userId}`, {
      method: 'PATCH', body: JSON.stringify(mongoPayload),
    })
    return { data: normalizeProfile(raw.data) }
  },
  getOrganizer: async (userId: string) => {
    const raw = await request<{ data: unknown }>(`/profiles/organizer/${userId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = raw.data as any
    if (!d) return { data: null }
    return {
      data: {
        id: String(d._id ?? d.id ?? ''),
        user_id: String(d.userId ?? ''),
        organization_name: d.organizationName ?? '',
        description: d.description ?? null,
        logo_url: d.logoUrl ?? null,
        website: d.website ?? null,
        social_links: d.socialLinks ?? null,
        verification_status: d.verificationStatus ?? 'pending',
        verified_at: d.verifiedAt ?? null,
        total_events: d.totalEvents ?? 0,
        follower_count: d.followerCount ?? 0,
        created_at: d.createdAt ?? '',
        updated_at: d.updatedAt ?? '',
      }
    }
  },
  createOrganizer: async (payload: unknown) => {
    const p = payload as {
      organization_name?: string
      description?: string | null
      logo_url?: string | null
      website?: string | null
      social_links?: Record<string, string> | null
    }
    const raw = await request<{ data: unknown }>('/profiles/organizer', {
      method: 'POST',
      body: JSON.stringify({
        organizationName: p.organization_name,
        description: p.description,
        logoUrl: p.logo_url,
        website: p.website,
        socialLinks: p.social_links,
      }),
    })
    return { data: raw.data }
  },
  allUsers: async (page = 1, pageSize = 20) => {
    const raw = await request<{ data: unknown[]; count: number }>(
      `/profiles/admin/users?page=${page}&pageSize=${pageSize}`
    )
    return { data: raw.data.map(normalizeProfile), count: raw.count }
  },
}

// ─── Registrations ────────────────────────────────────────────────────────────
export const registrationsApi = {
  register: (eventId: string) =>
    request<{ data: unknown }>('/registrations', { method: 'POST', body: JSON.stringify({ eventId }) }),
  cancel: (eventId: string) =>
    request<{ data: null }>(`/registrations/${eventId}/cancel`, { method: 'PATCH' }),
  myRegistrations: () => request<{ data: unknown[] }>('/registrations/my'),
  eventRegistrations: (eventId: string) =>
    request<{ data: unknown[] }>(`/registrations/event/${eventId}`),
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export const bookmarksApi = {
  list: () => request<{ data: unknown[] }>('/bookmarks'),
  add: (eventId: string) =>
    request<{ data: unknown }>('/bookmarks', { method: 'POST', body: JSON.stringify({ eventId }) }),
  remove: (eventId: string) =>
    request<{ data: null }>(`/bookmarks/${eventId}`, { method: 'DELETE' }),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request<{ data: unknown[] }>('/notifications'),
  markRead: (id: string) =>
    request<{ data: null }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    request<{ data: null }>('/notifications/read-all', { method: 'PATCH' }),
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  upload: (bucket: 'event-images' | 'avatars' | 'organizer-assets', file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadRequest(`/upload/${bucket}`, fd)
  },
}
