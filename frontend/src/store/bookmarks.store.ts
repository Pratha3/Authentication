import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bookmark } from '@/types'

interface BookmarksState {
  bookmarks: Bookmark[]
  bookmarkedIds: Set<string>
  isLoading: boolean
  setBookmarks: (bookmarks: Bookmark[]) => void
  addBookmark: (bookmark: Bookmark) => void
  removeBookmark: (eventId: string) => void
  isBookmarked: (eventId: string) => boolean
  setLoading: (loading: boolean) => void
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      bookmarkedIds: new Set<string>(),
      isLoading: false,

      setBookmarks: (bookmarks) =>
        set({ bookmarks, bookmarkedIds: new Set(bookmarks.map((b) => b.event_id)) }),

      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [bookmark, ...state.bookmarks],
          bookmarkedIds: new Set([...state.bookmarkedIds, bookmark.event_id]),
        })),

      removeBookmark: (eventId) =>
        set((state) => {
          const next = new Set(state.bookmarkedIds)
          next.delete(eventId)
          return {
            bookmarks: state.bookmarks.filter((b) => b.event_id !== eventId),
            bookmarkedIds: next,
          }
        }),

      isBookmarked: (eventId) => {
        const ids = get().bookmarkedIds
        // Guard: after hydration from localStorage the Set may be a plain array
        if (ids instanceof Set) return ids.has(eventId)
        return (ids as unknown as string[]).includes(eventId)
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'eventsphere-bookmarks',
      // Serialize Set → array, deserialize array → Set
      partialize: (state) => ({ bookmarkedIds: Array.from(state.bookmarkedIds) }),
      merge: (persisted, current) => ({
        ...current,
        // Restore array back to Set on hydration
        bookmarkedIds: new Set((persisted as { bookmarkedIds: string[] }).bookmarkedIds ?? []),
      }),
    }
  )
)
