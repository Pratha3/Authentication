'use client'
import { useCallback } from 'react'
import { useBookmarksStore } from '@/store/bookmarks.store'
import { useAuthStore } from '@/store/auth.store'
import { addBookmark, removeBookmark } from '@/services/api/bookmarks.service'
import { toast } from 'sonner'

export function useBookmark(eventId: string) {
  const { isBookmarked, addBookmark: addToStore, removeBookmark: removeFromStore } = useBookmarksStore()
  const { user } = useAuthStore()
  const bookmarked = isBookmarked(eventId)

  const toggleBookmark = useCallback(async () => {
    if (!user) { toast.error('Sign in to save events'); return }
    if (bookmarked) {
      removeFromStore(eventId)
      const { error } = await removeBookmark(user.id, eventId)
      if (error) { addToStore({ id: '', user_id: user.id, event_id: eventId, created_at: '' }); toast.error('Failed to remove bookmark') }
      else toast.success('Removed from bookmarks')
    } else {
      const { data, error } = await addBookmark(user.id, eventId)
      if (error || !data) { toast.error('Failed to bookmark event'); return }
      addToStore(data)
      toast.success('Event saved to bookmarks')
    }
  }, [user, eventId, bookmarked, addToStore, removeFromStore])

  return { bookmarked, toggleBookmark }
}
