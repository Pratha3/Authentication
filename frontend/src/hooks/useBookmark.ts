'use client'
import { useCallback, useEffect, useState } from 'react'
import { useBookmarksStore } from '@/store/bookmarks.store'
import { useAuthStore } from '@/store/auth.store'
import { addBookmark, removeBookmark } from '@/services/api/bookmarks.service'
import { toast } from 'sonner'

export function useBookmark(eventId: string, initialBookmarked = false) {
  const { isBookmarked, addBookmark: addToStore, removeBookmark: removeFromStore } = useBookmarksStore()
  const { user } = useAuthStore()
  const [localBookmarked, setLocalBookmarked] = useState(initialBookmarked)

  useEffect(() => {
    setLocalBookmarked(initialBookmarked || (eventId ? isBookmarked(eventId) : false))
  }, [eventId, initialBookmarked, isBookmarked])

  const bookmarked = Boolean(eventId && (localBookmarked || isBookmarked(eventId)))

  const toggleBookmark = useCallback(async () => {
    if (!eventId) { toast.error('Event is still loading'); return }
    if (!user) { toast.error('Sign in to save events'); return }
    if (bookmarked) {
      setLocalBookmarked(false)
      removeFromStore(eventId)
      const { error } = await removeBookmark(user.id, eventId)
      if (error) {
        setLocalBookmarked(true)
        addToStore({ id: '', user_id: user.id, event_id: eventId, created_at: '' })
        toast.error('Failed to remove bookmark')
      } else {
        toast.success('Removed from bookmarks')
      }
    } else {
      setLocalBookmarked(true)
      const { data, error } = await addBookmark(user.id, eventId)
      if (error || !data) {
        setLocalBookmarked(false)
        toast.error('Failed to bookmark event')
        return
      }
      addToStore(data)
      toast.success('Event saved to bookmarks')
    }
  }, [user, eventId, bookmarked, addToStore, removeFromStore])

  return { bookmarked, toggleBookmark }
}
