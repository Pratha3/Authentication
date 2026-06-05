import { notificationsApi } from '@/lib/api'
import type { Notification, ApiResponse } from '@/types'

// Normalise MongoDB camelCase → frontend snake_case
function normaliseNotification(raw: any): Notification {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    user_id: String(raw.userId ?? raw.user_id ?? ''),
    title: raw.title ?? '',
    body: raw.body ?? '',
    type: raw.type ?? 'system',
    data: raw.data ?? null,
    is_read: raw.isRead ?? raw.is_read ?? false,
    created_at: raw.createdAt ?? raw.created_at ?? '',
  }
}

export async function fetchNotifications(_userId: string): Promise<ApiResponse<Notification[]>> {
  void _userId
  try {
    const res = await notificationsApi.list()
    return { data: (res.data as unknown[]).map(normaliseNotification), error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch notifications' }
  }
}

export async function markNotificationRead(id: string): Promise<ApiResponse<null>> {
  try {
    await notificationsApi.markRead(id)
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to mark as read' }
  }
}

export async function markAllNotificationsRead(_userId: string): Promise<ApiResponse<null>> {
  void _userId
  try {
    await notificationsApi.markAllRead()
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to mark all as read' }
  }
}
