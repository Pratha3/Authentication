import { notificationsApi } from '@/lib/api'
import type { Notification, ApiResponse } from '@/types'

export async function fetchNotifications(_userId: string): Promise<ApiResponse<Notification[]>> {
  try {
    const res = await notificationsApi.list()
    return { data: res.data as Notification[], error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch notifications' }
  }
}

export async function markNotificationRead(id: string): Promise<ApiResponse<null>> {
  try {
    await notificationsApi.markRead(id)
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to mark notification read' }
  }
}

export async function markAllNotificationsRead(_userId: string): Promise<ApiResponse<null>> {
  try {
    await notificationsApi.markAllRead()
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to mark all notifications read' }
  }
}

export async function createNotification(
  payload: Omit<Notification, 'id' | 'created_at'>
): Promise<ApiResponse<Notification>> {
  // Notifications are created server-side; this is a no-op on the client
  return { data: null, error: 'Notifications are created server-side.' }
}
