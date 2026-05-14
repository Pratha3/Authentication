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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) return { url: '', error: data.message || 'Upload failed.' }
  return data
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (email: string, password: string, name?: string) =>
    request<AuthPayload>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getMe: () => request<{ user: AuthUser }>('/auth/me'),
}

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params: Record<string, string | number | boolean | string[] | undefined> = {}) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        qs.set(k, Array.isArray(v) ? v.join(',') : String(v))
      }
    }
    return request<{ data: unknown[]; count: number; page: number; pageSize: number; hasMore: boolean }>(
      `/events?${qs.toString()}`
    )
  },
  featured: () => request<{ data: unknown[] }>('/events/featured'),
  nearby: (lat: number, lon: number, radius?: number) =>
    request<{ data: unknown[] }>(`/events/nearby?latitude=${lat}&longitude=${lon}${radius ? `&radius=${radius}` : ''}`),
  bySlug: (slug: string) => request<{ data: unknown; error: string | null }>(`/events/${slug}`),
  organizerEvents: (organizerId: string) =>
    request<{ data: unknown[] }>(`/events/organizer/${organizerId}`),
  create: (payload: unknown) =>
    request<{ data: unknown }>('/events', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: unknown) =>
    request<{ data: unknown }>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) =>
    request<{ data: null }>(`/events/${id}`, { method: 'DELETE' }),
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profilesApi = {
  get: (userId: string) => request<{ data: unknown }>(`/profiles/${userId}`),
  update: (userId: string, payload: unknown) =>
    request<{ data: unknown }>(`/profiles/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getOrganizer: (userId: string) => request<{ data: unknown }>(`/profiles/organizer/${userId}`),
  createOrganizer: (payload: unknown) =>
    request<{ data: unknown }>('/profiles/organizer', { method: 'POST', body: JSON.stringify(payload) }),
  allUsers: (page = 1, pageSize = 20) =>
    request<{ data: unknown[]; count: number }>(`/profiles/admin/users?page=${page}&pageSize=${pageSize}`),
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
