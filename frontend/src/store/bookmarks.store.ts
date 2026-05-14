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
      bookmarkedIds: new Set(),
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

      isBookmarked: (eventId) => get().bookmarkedIds.has(eventId),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'eventsphere-bookmarks',
      partialize: (state) => ({ bookmarkedIds: Array.from(state.bookmarkedIds) }),
    }
  )
)
