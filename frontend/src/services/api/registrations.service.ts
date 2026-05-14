import { registrationsApi } from '@/lib/api'
import type { Registration, ApiResponse } from '@/types'

export async function registerForEvent(eventId: string, _userId: string): Promise<ApiResponse<Registration>> {
  try {
    const res = await registrationsApi.register(eventId)
    return { data: res.data as Registration, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Registration failed' }
  }
}

export async function cancelRegistration(eventId: string, _userId: string): Promise<ApiResponse<null>> {
  try {
    await registrationsApi.cancel(eventId)
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to cancel registration' }
  }
}

export async function fetchUserRegistrations(_userId: string): Promise<ApiResponse<Registration[]>> {
  try {
    const res = await registrationsApi.myRegistrations()
    return { data: res.data as Registration[], error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch registrations' }
  }
}

export async function fetchEventRegistrations(eventId: string): Promise<ApiResponse<Registration[]>> {
  try {
    const res = await registrationsApi.eventRegistrations(eventId)
    return { data: res.data as Registration[], error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch event registrations' }
  }
}
