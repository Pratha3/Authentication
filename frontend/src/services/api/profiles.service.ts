import { profilesApi } from '@/lib/api'
import type { Profile, Organizer, ApiResponse } from '@/types'

export async function fetchProfile(userId: string): Promise<ApiResponse<Profile>> {
  try {
    const res = await profilesApi.get(userId)
    return { data: res.data as Profile, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch profile' }
  }
}

export async function updateProfile(userId: string, payload: Partial<Profile>): Promise<ApiResponse<Profile>> {
  try {
    const res = await profilesApi.update(userId, payload)
    return { data: res.data as Profile, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update profile' }
  }
}

export async function fetchOrganizerProfile(userId: string): Promise<ApiResponse<Organizer>> {
  try {
    const res = await profilesApi.getOrganizer(userId)
    return { data: res.data as Organizer, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Organizer not found' }
  }
}

export async function createOrganizerProfile(
  payload: Omit<Organizer, 'id' | 'created_at' | 'updated_at' | 'total_events' | 'follower_count'>
): Promise<ApiResponse<Organizer>> {
  try {
    const res = await profilesApi.createOrganizer(payload)
    return { data: res.data as Organizer, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create organizer profile' }
  }
}

export async function updateOrganizerProfile(
  _id: string,
  _payload: Partial<Organizer>
): Promise<ApiResponse<Organizer>> {
  // TODO: add PATCH /api/profiles/organizer/:id endpoint when needed
  return { data: null, error: 'Not implemented yet.' }
}

export async function fetchAllUsers(
  page = 1,
  pageSize = 20
): Promise<{ data: Profile[]; count: number }> {
  try {
    const res = await profilesApi.allUsers(page, pageSize)
    return { data: res.data as Profile[], count: res.count }
  } catch {
    return { data: [], count: 0 }
  }
}
