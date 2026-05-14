import { bookmarksApi } from '@/lib/api'
import type { Bookmark, ApiResponse } from '@/types'

export async function fetchUserBookmarks(_userId: string): Promise<ApiResponse<Bookmark[]>> {
  try {
    const res = await bookmarksApi.list()
    return { data: res.data as Bookmark[], error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch bookmarks' }
  }
}

export async function addBookmark(_userId: string, eventId: string): Promise<ApiResponse<Bookmark>> {
  try {
    const res = await bookmarksApi.add(eventId)
    return { data: res.data as Bookmark, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to add bookmark' }
  }
}

export async function removeBookmark(_userId: string, eventId: string): Promise<ApiResponse<null>> {
  try {
    await bookmarksApi.remove(eventId)
    return { data: null, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to remove bookmark' }
  }
}
